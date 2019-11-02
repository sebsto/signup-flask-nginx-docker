/*********************************************************
 * CUSTOMIZE THE BELOW CONSTANTS BEFORE USING THIS SCRIPT
 *********************************************************/

// GitHub username and repo

const github = {
  owner: "sebsto",
  repo: "ecs-demo",
  //TODO can we create the SM secret in this stack ?
  secret_manager_secret_name: "my-github-token"
}

// ECS cluster where to deploy 
// TODO : get serviceName and clusterName from output of the ECSStack

const ecs = {
  serviceName: 'CdkEcsClusterStack-ECSDemoFlaskClusterService64792F81-139FZUMNQ8F4Z',
  clusterName: 'CdkEcsClusterStack-ECSDemoFlaskClusterEA6F5D7D-HSE4OU91QC5D'
}


import cdk = require('@aws-cdk/core');
import pipeline = require('@aws-cdk/aws-codepipeline');
import pipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');
import kms = require('@aws-cdk/aws-kms');
import s3 = require('@aws-cdk/aws-s3');
import { BuildSpec } from '@aws-cdk/aws-codebuild';
import { Role, ManagedPolicy } from '@aws-cdk/aws-iam'

import { MyEcsDeployAction } from './MyEcsDeployAction';

export class CdkEcsPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create the source action (github)
    const sourceOutput = new pipeline.Artifact();
    const sourceAction = new pipeline_actions.GitHubSourceAction({
      actionName: "GitHubTrigger",
      owner: github.owner,
      repo: github.repo,
      oauthToken: cdk.SecretValue.secretsManager(github.secret_manager_secret_name),
      output: sourceOutput,
      branch: 'master'
    });

    // create the build action
    const buildProject = new codebuild.PipelineProject(this, 'ECSFlaskSignupCodeBuildProject', {
      projectName: 'ECSFlaskSignupBuild',
      buildSpec: BuildSpec.fromSourceFilename('build/buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true
      }
    });

    // add codebuild permissions to access ECR (to push the image to the repo)
    const role = <Role>buildProject.role;
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'));

    const buildOutput = new pipeline.Artifact();
    const buildAction = new pipeline_actions.CodeBuildAction({
      actionName: 'CodeBuildDockerImage',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput]
    });

    // create the deploy action 

    // as of today, it is not possible to create a BaseService from the cluster name or ARN
    // workaround is to build the IAction object ourself
    // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ecs.BaseService.html
    // https://github.com/aws/aws-cdk/issues/4375

    const deployAction = new MyEcsDeployAction({
      actionName: 'Deploy',
      serviceName: ecs.serviceName,
      clusterName: ecs.clusterName,
      input: buildOutput,
    });
    // const deployAction = new pipeline_actions.EcsDeployAction({
    //   actionName: 'DeployAction',
    //   service: ecs.serviceName,
    //   // if your file is called imagedefinitions.json,
    //   // use the `input` property,
    //   // and leave out the `imageFile` property
    //   input: buildOutput,
    //   // if your file name is _not_ imagedefinitions.json,
    //   // use the `imageFile` property,
    //   // and leave out the `input` property
    //   // imageFile: sourceOutput.atPath('imageDef.json'),
    // });

    // workaround for a KMS key alias issue I have 
    // https://github.com/aws/aws-cdk/issues/4374
    const key = new kms.Key(this, 'Key');
    const myArtifactBucket = new s3.Bucket(this, 'ECSDemoFlaskSignupBucket', {
      encryptionKey: key, // no Alias here!
    });
    
    // finally, create the pipeline
    const codePipeline = new pipeline.Pipeline(this, 'ECSDemoFlaskSignupPipeline', {
      artifactBucket: myArtifactBucket,
      pipelineName: 'ECSFlaskSignupDeploy',
      stages: [
        {
          stageName: 'GetFlaskSignupSource',
          actions: [sourceAction],
        },
        {
          stageName: 'BuildFlaskSignupDockerImage',
          actions: [buildAction]
        },
        {
          stageName: 'DeployFlaskSignupToEcs',
          actions: [deployAction]
        }
      ],
    });
  }
}
