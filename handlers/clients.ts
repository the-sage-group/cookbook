import * as ACM from "@aws-sdk/client-acm";
import * as EC2 from "@aws-sdk/client-ec2";
import * as Route53 from "@aws-sdk/client-route-53";
import * as ELB from "@aws-sdk/client-elastic-load-balancing-v2";
import * as IAM from "@aws-sdk/client-iam";

export const clients = {
  acm: new ACM.ACM({ region: "us-west-2" }),
  ec2: new EC2.EC2({ region: "us-west-2" }),
  route53: new Route53.Route53({ region: "us-west-2" }),
  elb: new ELB.ElasticLoadBalancingV2({ region: "us-west-2" }),
  iam: new IAM.IAM({ region: "us-west-2" }),
};

export type HandlerClients = typeof clients;
