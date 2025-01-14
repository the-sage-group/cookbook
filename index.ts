import { AwyesClient, credentials, Node } from "@the-sage-group/awyes-node";

import * as aws from "./aws";

const client = new AwyesClient("localhost:50051", credentials.createInsecure());

for (const { node } of Object.values(aws.nodes)) {
  client.registerNode({ node: node as Node }, (error, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log(response);
    }
  });
}

const stream = client.runAndWait();

stream.on("data", (response) => {
  // Handle each response from the server
  console.log("Received response:", response);
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
