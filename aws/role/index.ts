import { Node } from "@the-sage-group/awyes-node";
import { clients } from "../clients";

export const createRole = {
  node: {
    version: 1,
    context: "aws",
    name: "create_role",
    description: "Creates an IAM role with the specified name",
  },
  async handler({ iam }: typeof clients, params: Node["parameters"]) {
    const { name, description } = params as {
      name: string;
      description: string;
    };

    await iam.createRole({
      RoleName: name,
      Description: description,
      AssumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: [
                "ec2.amazonaws.com",
                "ecs.amazonaws.com",
                "ecs-tasks.amazonaws.com",
                "route53.amazonaws.com",
                "rds.amazonaws.com",
                "lambda.amazonaws.com",
                "secretsmanager.amazonaws.com",
                "ssm.amazonaws.com",
                "s3.amazonaws.com",
              ],
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    });

    const policies = [
      "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess",
      "arn:aws:iam::aws:policy/CloudWatchFullAccessV2",
      "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
      "arn:aws:iam::aws:policy/AmazonS3FullAccess",
      "arn:aws:iam::aws:policy/AmazonSSMFullAccess",
      "arn:aws:iam::aws:policy/SecretsManagerReadWrite",
      "arn:aws:iam::aws:policy/service-role/ROSAKMSProviderPolicy",
      "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
    ];

    for (const policyArn of policies) {
      await iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: policyArn,
      });
    }

    const getRole = await iam.getRole({ RoleName: name });
    return { roleArn: getRole.Role?.Arn! };
  },
};
