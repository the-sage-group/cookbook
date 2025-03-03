import { Label, Event, labelToJSON } from "@the-sage-group/awyes-node";

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

export default [startInfra, endInfra];
