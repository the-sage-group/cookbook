import * as awyes from "@the-sage-group/awyes";
import * as EC2 from "@aws-sdk/client-ec2";

const ec2 = new EC2.EC2({ region: "us-west-2" });

export function getInfra() {
  return new awyes.Flow()
    .add("describeVpcs", () => ec2.describeVpcs())
    .add("describeSubnets", async (context) => {
      const describeVpcs = await context.describeVpcs;
      return ec2.describeSubnets({
        Filters: [
          {
            Name: "vpc-id",
            Values: describeVpcs.Vpcs?.map((vpc) => vpc.VpcId!),
          },
        ],
      });
    })
    .add("getSubnetIds", async (context) => {
      const describeSubnets = await context.describeSubnets;
      return describeSubnets.Subnets?.map((subnet) => subnet.SubnetId!);
    });
}
