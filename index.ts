import {
  AwyesClient,
  credentials,
  Event,
  Status,
} from "@the-sage-group/awyes-node";

import * as aws from "./aws";
import { clients } from "./aws/clients";

const client = new AwyesClient("localhost:50051", credentials.createInsecure());
const router = {};

for (const handler of aws.nodes) {
  client.registerHandler({ handler }, (error, response) => {
    if (error) {
      throw error;
    } else {
      router[`${handler.context}.${handler.name}`] = handler.handler;
      // console.dir(response, { depth: null });
    }
  });
}

const stream = client.runNodeAndWait();

stream.on("data", async (event: Event) => {
  // Handle each event from the server
  console.log("Received event:", event);
  switch (event.status) {
    case Status.EXECUTING:
      const { position } = event;
      if (!position) {
        throw new Error("Position is undefined");
      }
      const handlerFn =
        router[`${position.handler?.context}.${position.handler?.name}`];
      const result = await handlerFn(clients, event.state);
      const response = {
        ...event,
        ...result,
        status: Status.COMPLETED,
      };
      console.log("Completed event:", response);
      stream.write(response);
      break;
    default:
      console.log("Unknown event type:", event.status);
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
