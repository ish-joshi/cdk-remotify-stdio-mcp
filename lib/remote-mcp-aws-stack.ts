import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemotifyStdioSseMcp } from './remotify-stdio-sse-mcp';

export class RemoteMcpAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const remoteTimeMCP = new RemotifyStdioSseMcp(this, 'RemoteTimeMCP', {
      mcpCommand: 'uvx mcp-server-time --local-timezone=Australia/Melbourne',
      includeHealthCheck: true,
    });

    new cdk.CfnOutput(this, 'RemoteTimeMCPUrl', {
      value: remoteTimeMCP.service.loadBalancer.loadBalancerDnsName,
      description: 'The URL of the Remote Time MCP service',
    });

  }
}
