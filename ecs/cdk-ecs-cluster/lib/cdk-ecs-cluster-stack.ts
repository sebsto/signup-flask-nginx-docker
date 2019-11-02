import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import ecr = require('@aws-cdk/aws-ecr');
import iam = require('@aws-cdk/aws-iam');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');
import { ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';

export class CdkEcsClusterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create VPC with public/private subnet in 2 AZ + NAT Gateway + IGW 
    const vpc = new ec2.Vpc(this, 'ECSDemoFlaskVpc', {
      maxAzs: 2 // Default is all AZs in region
    });

    // create ECS cluster in the VPC
    const cluster = new ecs.Cluster(this, 'ECSDemoFlaskCluster', {
      vpc: vpc
    });

    // Add capacity to it
    cluster.addCapacity('ECSDemoFlaskAutoScalingGroupCapacity', {
      instanceType: new ec2.InstanceType("t2.large"),
      desiredCapacity: 2,
    });

    // create a role allowing container to access our DynamoDB table
    const taskRole = new iam.Role(this, 'ECSDemoFlaskTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com')
    });
    taskRole.addToPolicy(new PolicyStatement({
      resources: ['arn:aws:dynamodb:us-west-2:486652066693:table/new_startup_signups'],
      actions: ['dynamodb:PutItem'] 
    }));


    // import existing repo 
    const repo = ecr.Repository.fromRepositoryName(this, 'ECSFlaskDemoRepository', 'demo-flask-signup');

    // Create a load-balanced EC2 service and make it public
    const clusterService = new ecs_patterns.ApplicationLoadBalancedEc2Service(this, 'ECSDemoFlaskClusterService', {
      cluster,
      memoryLimitMiB: 1024,
      taskImageOptions : {
        image : ecs.ContainerImage.fromEcrRepository(repo, 'latest'),
        containerName: 'demo-flask-signup',
        taskRole: taskRole
      },
      desiredCount: 2  // Default is 1
    });

    // Output the values we need to access your service
    new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: clusterService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'ECSClusterName', { value: clusterService.cluster.clusterName });
    new cdk.CfnOutput(this, 'ECSServiceName', { value: clusterService.service.serviceName });

    // just for a demo to have quicker container registration
    clusterService.targetGroup.configureHealthCheck({
      healthyThresholdCount : 2,
      unhealthyThresholdCount : 2,
      timeout : cdk.Duration.seconds(3),
      interval : cdk.Duration.seconds(5) 
    });

    // https://github.com/aws/aws-cdk/issues/4015
    // clusterService.targetGroup.deregistrationDelaySec = 10;
    clusterService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '10');
  }
}


