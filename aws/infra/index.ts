import { Node } from "@the-sage-group/awyes";
import { clients } from "../clients";

export const getInfra = {
  node: {
    version: 1,
    context: "aws",
    name: "get_infra",
    description:
      "Retrieves infrastructure details such as VPCs, subnets, and subnet IDs",
  },
  async handler({ ec2 }: typeof clients, params: Node["parameters"]) {
    const describeVpcs = await ec2.describeVpcs();
    const describeSubnets = await ec2.describeSubnets({
      Filters: [
        {
          Name: "vpc-id",
          Values: describeVpcs.Vpcs?.map((vpc) => vpc.VpcId!),
        },
      ],
    });
    return {
      subnetIds:
        describeSubnets.Subnets?.map((subnet) => subnet.SubnetId!) || [],
      vpcIds: describeVpcs.Vpcs?.map((vpc) => vpc.VpcId!) || [],
    };
  },
};
