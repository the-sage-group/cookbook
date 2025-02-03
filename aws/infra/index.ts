import {
  FieldType,
  FieldLabel,
  Label,
  Event,
  labelToJSON,
} from "@the-sage-group/awyes-node";
import { HandlerClients } from "../clients";

export const getInfra = {
  version: 1,
  context: "aws",
  name: "get_infra",
  description:
    "Retrieves infrastructure details such as VPCs, subnets, and subnet IDs",
  parameters: [],
  returns: [
    {
      name: "subnetIds",
      type: FieldType.TYPE_STRING,
      label: FieldLabel.LABEL_REPEATED,
    },
    {
      name: "vpcIds",
      type: FieldType.TYPE_STRING,
      label: FieldLabel.LABEL_REPEATED,
    },
  ],
  async handler(clients: HandlerClients): Promise<Event> {
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
      return {
        label: labelToJSON(Label.FAILURE),
        message: "Failed to fetch infrastructure: Missing VPCs or Subnets",
        state: {},
      };
    }

    return {
      label: labelToJSON(Label.SUCCESS),
      state: {
        subnetIds: describeSubnets.Subnets.map((subnet) => subnet.SubnetId),
        vpcIds: describeVpcs.Vpcs.map((vpc) => vpc.VpcId),
      },
    };
  },
};
