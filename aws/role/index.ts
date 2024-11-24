import * as awyes from "@the-sage-group/awyes";
import * as IAM from "@aws-sdk/client-iam";

const iam = new IAM.IAM({ region: "us-west-2" });

export function createRole({ name }: { name: string }) {
  return new awyes.Flow()
    .add("createRole", () => {
      return iam.createRole({
        RoleName: name,
        Description: "Role for Sage on AWS",
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
    })
    .add("attachEc2Policy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn:
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess",
      });
    })
    .add("attachLogsPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/CloudWatchFullAccessV2",
      });
    })
    .add("attachLambdaPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
      });
    })
    .add("attachS3Policy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/AmazonS3FullAccess",
      });
    })
    .add("attachSsmPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/AmazonSSMFullAccess",
      });
    })
    .add("attachSecretsPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/SecretsManagerReadWrite",
      });
    })
    .add("attachKmsPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/ROSAKMSProviderPolicy",
      });
    })
    .add("attachRdsPolicy", () => {
      return iam.attachRolePolicy({
        RoleName: name,
        PolicyArn: "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
      });
    })
    .add("getRole", () => {
      return iam.getRole({ RoleName: name });
    });
}
