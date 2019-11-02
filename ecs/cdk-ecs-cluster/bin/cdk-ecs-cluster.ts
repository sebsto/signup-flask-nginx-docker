#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { CdkEcsClusterStack } from '../lib/cdk-ecs-cluster-stack';

const app = new cdk.App();
new CdkEcsClusterStack(app, 'CdkEcsClusterStack', {
    env: {region: "us-west-2"}
});