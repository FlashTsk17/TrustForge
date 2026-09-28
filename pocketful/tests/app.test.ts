import { createApp } from "../src/app.js";

const app = createApp();

async function request(path: string) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const server = app.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to resolve test server address"));
        return;
      }

      fetch(`http://127.0.0.1:${address.port}${path}`)
        .then(async (response) => ({ status: response.status, body: await response.text() }))
        .then((result) => {
          server.close();
          resolve(result);
        })
        .catch((error) => {
          server.close();
          reject(error);
        });
    });
  });
}

describe("Pocketful runtime skeleton", () => {
  it("exposes a health endpoint", async () => {
    const response = await request("/health");
    expect(response.status).toBe(200);
    expect(response.body).toContain('"status":"ok"');
  });
});
