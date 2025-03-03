import {
  AwyesClient,
  credentials,
  Event,
  Status,
} from "@the-sage-group/awyes-node";
import * as fs from "fs";
import * as path from "path";

// Import all handlers from the handlers/index.ts file
import handlers from "./handlers";
import { clients } from "./handlers/clients";

const client = new AwyesClient("localhost:50051", credentials.createInsecure());
const router: Record<string, Function> = {};

// Register all handlers
for (const handler of handlers) {
  client.registerHandler({ handler }, (error) => {
    if (error) {
      throw error;
    } else {
      router[`${handler.context}.${handler.name}`] = handler.handler;
    }
  });
}

// Register all routes
const routesDir = path.join(process.cwd(), "routes");
for (const file of fs.readdirSync(routesDir)) {
  if (file.endsWith(".textproto")) {
    const routePath = path.join(routesDir, file);

    try {
      const route = fs.readFileSync(routePath, "utf8");
      client.registerRoute({ route }, (error, response) => {
        if (error) {
          console.error(`Error registering route ${file}:`, error, response);
        } else {
          console.log(`Registered route: ${file}`);
        }
      });
    } catch (error) {
      console.error(`Error reading route file ${file}:`, error);
    }
  }
}

// Run the node and wait for it to complete
const stream = client.runNodeAndWait();

stream.on("data", async (event: Event) => {
  // Handle each event from the server
  console.log("Received event:", event);
  switch (event.status) {
    case Status.EXECUTING:
      const { position } = event;
      if (!position || !position.handler) {
        throw new Error("Position or handler is undefined");
      }

      // First convert to unknown, then to Handler to avoid type errors
      const handlerFn = router[position.handler];
      if (!handlerFn) {
        throw new Error(`Handler not found for ${position.handler}`);
      }

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
