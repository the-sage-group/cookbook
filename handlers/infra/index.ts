import {
  Label,
  Event,
  labelToJSON,
  FieldType,
} from "@the-sage-group/awyes-node";

const startInfra = {
  version: 1,
  context: "infra",
  name: "start",
  description: "Starts a route",
  parameters: [],
  returns: [],
  async handler(): Promise<Event> {
    return {
      exitLabel: labelToJSON(Label.SUCCESS),
      exitMessage: "Route started successfully",
      state: {},
    };
  },
};

const errorInfra = {
  version: 1,
  context: "infra",
  name: "error",
  description: "Echoes an error",
  parameters: [
    {
      name: "message",
      type: FieldType.TYPE_STRING,
      description: "Error message to echo",
    },
  ],
  returns: [],
  async handler({ message }: { message: string }): Promise<Event> {
    return {
      exitLabel: labelToJSON(Label.FAILURE),
      exitMessage: message || "An error occurred",
      state: {},
    };
  },
};

const endInfra = {
  version: 1,
  context: "infra",
  name: "end",
  description: "Ends a route",
  parameters: [],
  returns: [],
  async handler(): Promise<Event> {
    return {
      exitLabel: labelToJSON(Label.SUCCESS),
      exitMessage: "Route ended successfully",
      state: {},
    };
  },
};

export default [startInfra, errorInfra, endInfra];
