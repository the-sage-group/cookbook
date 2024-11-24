import * as awyes from "@the-sage-group/awyes";
import * as EC2 from "@aws-sdk/client-ec2";
import * as Route53 from "@aws-sdk/client-route-53";
import * as ELB from "@aws-sdk/client-elastic-load-balancing-v2";
import { getInfra } from "../infra";

const ec2 = new EC2.EC2({ region: "us-west-2" });
const route53 = new Route53.Route53({ region: "us-west-2" });
const elb = new ELB.ElasticLoadBalancingV2({ region: "us-west-2" });

export function createLoadBalancer({
  name,
  type,
  port,
  scheme,
  protocol,
  domainName,
  infra,
}: {
  name: string;
  port: number;
  protocol: string;
  type: ELB.LoadBalancerTypeEnum;
  scheme: ELB.LoadBalancerSchemeEnum;
  domainName: string;
  infra: ReturnType<typeof getInfra>;
}) {
  return new awyes.Flow()
    .add("createSecurityGroup", () =>
      ec2.createSecurityGroup({
        GroupName: name,
        Description: "Sage generic load balancer security group",
      })
    )
    .add("describeSecurityGroup", () =>
      ec2.describeSecurityGroups({ GroupNames: [name] })
    )
    .add("authorizeIngress", async () =>
      ec2.authorizeSecurityGroupIngress({
        ToPort: port,
        FromPort: port,
        IpProtocol: protocol,
        CidrIp: "0.0.0.0/0",
        GroupName: name,
      })
    )
    .add("createLoadBalancer", async (context) => {
      const securityGroups = await context.describeSecurityGroup;
      const subnets = await infra.context.getSubnetIds;
      return elb.createLoadBalancer({
        Name: name,
        Subnets: subnets,
        SecurityGroups: securityGroups.SecurityGroups?.map(
          ({ GroupId }) => GroupId!
        ),
        Scheme: scheme,
        Type: type,
      });
    })
    .add("waitForLoadBalancer", async (context) => {
      const createLoadBalancer = await context.createLoadBalancer;
      const ready = await ELB.waitUntilLoadBalancerAvailable(
        { client: elb, maxWaitTime: 300 },
        {
          LoadBalancerArns: [
            createLoadBalancer.LoadBalancers?.[0].LoadBalancerArn!,
          ],
        }
      );
      return ready;
    })
    .add("describeLoadBalancers", async (context) => {
      const createLoadBalancer = await context.createLoadBalancer;
      return elb.describeLoadBalancers({
        Names: [createLoadBalancer.LoadBalancers?.[0].LoadBalancerName!],
      });
    })
    .add("listHostedZonesByName", () =>
      route53.listHostedZonesByName({ DNSName: domainName })
    )
    .add("changeResourceRecordSets", async (context) => {
      const describeLoadBalancers = await context.describeLoadBalancers;
      const hostedZone = await context.listHostedZonesByName;

      return route53.changeResourceRecordSets({
        HostedZoneId: hostedZone.HostedZones?.[0].Id!,
        ChangeBatch: {
          Changes: [
            {
              Action: "UPSERT",
              ResourceRecordSet: {
                Name: domainName,
                Type: "A",
                AliasTarget: {
                  HostedZoneId:
                    describeLoadBalancers.LoadBalancers?.[0]
                      .CanonicalHostedZoneId!,
                  DNSName: describeLoadBalancers.LoadBalancers?.[0].DNSName!,
                  EvaluateTargetHealth: false,
                },
              },
            },
          ],
        },
      });
    })
    .add("waitForRecordSetsChanged", async (context) => {
      const changeResourceRecordSets = await context.changeResourceRecordSets;
      const ready = await Route53.waitUntilResourceRecordSetsChanged(
        { client: route53, maxWaitTime: 300 },
        { Id: changeResourceRecordSets.ChangeInfo?.Id }
      );
      return ready;
    });
}
