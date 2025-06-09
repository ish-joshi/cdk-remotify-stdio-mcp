# Remotify MCP 

Easily convert local (STDIO transport) MCP servers to remote (sse for now) transport.

The flexible CDK construct allows you to deploy a remote MCP server that can be used by any MCP client supporting SSE (Server-Sent Events).

Simply specify the mcp command to run and the construct will spin up the necessary infrastructure to host it.




## Architecture
Currently the construct deploys a ECSFargate service with a load balancer in front of it. The service runs a Docker container that executes the specified MCP command and serves the output over SSE.


### Next steps
- Add support for more transports (e.g. WebSocket)
- Add support for Streamable HTTP
- Support hosting via Lambda (for simple commands) - this would allow for a more cost-effective solution for low-traffic commands.
- Provide a way to easily get HTTP(S) URLs for the deployed services (probably via hosting in API Gateway)




## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
