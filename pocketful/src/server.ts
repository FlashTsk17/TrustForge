import { createStage1App } from "./stage1.js";

const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");

const app = createStage1App();
app.listen(port, "0.0.0.0", () => {
  console.log(`Pocketful Stage 1 listening on 0.0.0.0:${port}`);
});
