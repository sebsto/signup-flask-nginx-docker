#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CdkEcsPipelineStack } from '../lib/cdk-ecs-pipeline-stack';

const app = new cdk.App();
new CdkEcsPipelineStack(app, 'CdkEcsPipelineStack', {
    env: {region: "us-west-2"}
});
