import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, ContainerImage, Secret as ECSSecret } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService, ApplicationLoadBalancedFargateServiceProps, ApplicationLoadBalancedTaskImageOptions } from "aws-cdk-lib/aws-ecs-patterns";
import { Secret as SMSecret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface RemotifyStdioSseMcpProps {
    mcpCommand: string;
    includeHealthCheck?: boolean;
    secrets?: { [key: string]: string | SMSecret };
    vpc?: IVpc;
    cluster?: Cluster;
    dockerImage?: string;
}

export class RemotifyStdioSseMcp extends Construct {

    public readonly service: ApplicationLoadBalancedFargateService;
    public readonly localDockerRunCommand: string;

    constructor(scope: Construct, id: string, props?: any) {
        super(scope, id);

        const vpc = props.vpc || props.cluster?.vpc || new Vpc(this, `${id}Vpc`, {
            maxAzs: 2, // Default to 2 availability zones
        });

        const cluster = props.cluster || new Cluster(this, `${id}Cluster`, {
            vpc,
        });

        const ecsSecrets: { [key: string]: ECSSecret } = {};
        // process the secrets if provided
        if (props.secrets) {
            for (const [key, value] of Object.entries(props.secrets)) {
                // check if it is secretmanager arn
                if (typeof value === 'string' && value.startsWith('arn:aws:secretsmanager:')) {
                    ecsSecrets[key] = ECSSecret.fromSecretsManager(SMSecret.fromSecretCompleteArn(this, `${id}${key}Secret`, value));
                } else if (value instanceof SMSecret) {
                    ecsSecrets[key] = ECSSecret.fromSecretsManager(value);
                } else {
                    // assume it's a secret name in the current account and region
                    ecsSecrets[key] = ECSSecret.fromSecretsManager(SMSecret.fromSecretNameV2(this, `${id}${key}Secret`, value as string));
                }
            }
        }

        const command = [
            "--stdio", props.mcpCommand,
            "--port", "8000",
            "--baseUrl", "http://localhost:8000",
            "--ssePath", "/sse",
            "--messagePath", "/message",
            ...(props.includeHealthCheck ? ["--healthEndpoint", "/healthz"] : []),
        ]

        const localCommand = [
            "--stdio", props.mcpCommand,
            "--port", "8000",
            "--baseUrl", "http://localhost:8000",
            "--ssePath", "/sse",
            "--messagePath", "/message",
        ]

        let dockerImage = props.dockerImage || "supercorp/supergateway";
        if (props.mcpCommand.startsWith("uvx")) {
            dockerImage = "supercorp/supergateway:uvx";
        } else if (props.mcpCommand.startsWith("deno")) {
            dockerImage = "supercorp/supergateway:deno";
        }

        if (props.dockerImage) dockerImage = props.dockerImage;

        const taskImageOptions: ApplicationLoadBalancedTaskImageOptions = {
            image: ContainerImage.fromRegistry(dockerImage),
            containerPort: 8000,
            command,
            secrets: ecsSecrets,   
        }

        this.service = new ApplicationLoadBalancedFargateService(this, `${id}Service`, {
            cluster,
            serviceName: `${id}MCPService`,
            taskImageOptions,
            publicLoadBalancer: true,
        });

        if (props.includeHealthCheck) {
            this.service.targetGroup.configureHealthCheck({
                path: "/healthz",
                healthyHttpCodes: "200",
            });
        }

        this.localDockerRunCommand = `docker run --env-file .env -it --rm -p 8000:8000 ${dockerImage} ${localCommand.join(" ")}`;

    }
}



