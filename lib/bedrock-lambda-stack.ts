import {
  Stack,
  StackProps,
  aws_lambda_nodejs,
  aws_lambda,
  aws_iam,
  Duration,
  CfnOutput
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

export class BedrockLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bedrockLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      "BedrockLambda",
      {
        runtime: aws_lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "../src/lambda/bedrock/index.ts"),
        bundling: {
          forceDockerBundling: false,
        },
        timeout: Duration.seconds(90),
      }
    );

    const bedrockResponseStreamingLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      "BedrockResponseStreamingLambda",
      {
        runtime: aws_lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "../src/lambda/bedrock-repsone-streaming/index.ts"),
        bundling: {
          forceDockerBundling: false,
          nodeModules:['lambda-stream']
        },
        timeout: Duration.seconds(90),
      }
    );

    bedrockLambda.addToRolePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    bedrockResponseStreamingLambda.addToRolePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ["bedrock:InvokeModel","bedrock:InvokeModelWithResponseStream"],
        resources: ["*"],
      })
    );   

    const lambdaUrl = bedrockResponseStreamingLambda.addFunctionUrl({
      authType: aws_lambda.FunctionUrlAuthType.NONE,
      invokeMode: aws_lambda.InvokeMode.RESPONSE_STREAM
    });

    new CfnOutput(this,'LambdaEndpoint',{
      value:lambdaUrl.url
    })

  }
}
