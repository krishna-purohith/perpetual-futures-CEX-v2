import { createClient } from "redis";
import SuperJSON from "superjson";

export const publisher = await createClient()
  .on("error", (err) => console.error("Redis publisher error", err))
  .connect();

export const subscriber = await createClient()
  .on("error", (err) => console.error("Redis subscriber error", err))
  .connect();
console.log("redis publisher n subscriber are connected");

subscriber.xGroupCreate("backendGroup", `backend-${Math.random()}`, "$", {
  MKSTREAM: true,
});

const pendingRequests = new Map<number, (value: unknown) => void>();

export function loopback(payload: Record<string, string>) {
  const correlationId = Math.random();
  const parsedPayload = SuperJSON.stringify(payload);

  return new Promise((resolve, reject) => {
    console.log("in promise");
    pendingRequests.set(correlationId, resolve);
    publisher.xAdd("requestQueue", "*", { data: parsedPayload });
    setTimeout(() => {
      if (pendingRequests.get(correlationId)) {
        console.log("after timeout.");
        pendingRequests.delete(correlationId);
        reject("Engine request time out. Please refresh your orders");
      }
    }, 3000);
  });
}

let lastId = "$";

async function startListeningfromEngine(identifier: string) {
  let counter = 0;
  while (1) {
    console.log(identifier);

    const engResponse = await subscriber.xReadGroup(
      "engineToBackendGroup",
      "backend",
      { id: ">", key: "responseQueue" },
      { BLOCK: 3000, COUNT: 1 }
    );

    if (!engResponse) {
      console.log("nothng received from engine", counter++);
      continue;
    }

    console.log("engResponsek:", engResponse);

    for (const stream of engResponse) {
      for (const { id, message } of stream.messages) {
        lastId = id;

        console.log("-------------before calling resolve");

        const resolve = pendingRequests.get(message.orderId);
        if (resolve) {
          console.log("****************************im from resolve");
          resolve(message);
          console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj");
          pendingRequests.delete(message.orderId);
        }
      }
    }
  }
}

startListeningfromEngine("krishna");
