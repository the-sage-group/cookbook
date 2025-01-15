import {
  FieldDescriptorProto_Type,
  FieldDescriptorProto_Label,
} from "@the-sage-group/awyes-node";
import { HandlerClients } from "../clients";

export const getInfra = {
  node: {
    version: 1,
    context: "aws",
    name: "get_infra",
    description:
      "Retrieves infrastructure details such as VPCs, subnets, and subnet IDs",
    parameters: [],
    returns: [
      {
        name: "subnetIds",
        type: FieldDescriptorProto_Type.TYPE_STRING,
        label: FieldDescriptorProto_Label.LABEL_REPEATED,
      },
      {
        name: "vpcIds",
        type: FieldDescriptorProto_Type.TYPE_STRING,
        label: FieldDescriptorProto_Label.LABEL_REPEATED,
      },
    ],
  },
  async handler(clients: HandlerClients) {
    const { ec2 } = clients;

    const describeVpcs = await ec2.describeVpcs();
    const describeSubnets = await ec2.describeSubnets({
      Filters: [
        {
          Name: "vpc-id",
          Values: describeVpcs.Vpcs?.map((vpc) => vpc.VpcId!),
        },
      ],
    });

    if (!describeVpcs.Vpcs || !describeSubnets.Subnets) {
      throw new Error(
        "Failed to fetch infrastructure: Missing VPCs or Subnets"
      );
    }

    return {
      subnetIds: describeSubnets.Subnets.map((subnet) => subnet.SubnetId!),
      vpcIds: describeVpcs.Vpcs.map((vpc) => vpc.VpcId!),
    };
  },
};
