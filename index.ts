import {
  AwyesClient,
  credentials,
  Node,
  Event,
  EventType,
} from "@the-sage-group/awyes-node";

import * as aws from "./aws";
import { clients } from "./aws/clients";

const client = new AwyesClient("localhost:50051", credentials.createInsecure());
const router = {};

for (const { node, handler } of aws.nodes) {
  client.registerNode({ node: node as Node }, (error, response) => {
    if (error) {
      throw error;
    } else {
      router[`${node.context}.${node.name}`] = handler;
      console.dir(response, { depth: null });
    }
  });
}

const stream = client.runAndWait();

stream.on("data", async (response: Event) => {
  // Handle each response from the server
  console.log("Received response:", response);
  switch (response.type) {
    case EventType.EXECUTING:
      const { node } = response;
      if (!node) {
        throw new Error("Node is undefined");
      }
      const handler = router[`${node.context}.${node.name}`];
      const result = await handler(clients, node.parameters);
      stream.write({
        type: EventType.COMPLETED,
        node: node,
        trip: response.trip,
        label: result.label,
        timestamp: Date.now(),
      });
      break;
    default:
      console.log("Unknown event type:", response.type);
      break;
  }
});

stream.on("error", (error) => {
  // Handle any errors that occur during streaming
  console.error("Stream error:", error);
});

stream.on("end", () => {
  // Handle stream completion
  console.log("Stream ended");
  stream.end();
});
