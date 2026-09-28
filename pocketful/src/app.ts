import express from "express";
import type { AccountRepository } from "./accounts.js";

export function createApp(accounts?: AccountRepository) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  if (accounts) {
    app.post("/accounts", async (_request, response) => {
      try {
        const account = await accounts.create();
        response.status(201).json(account);
      } catch {
        response.status(500).json({ error: "account_creation_failed" });
      }
    });

    app.get("/accounts/:id", async (request, response) => {
      try {
        const account = await accounts.findById(request.params.id);
        if (!account) {
          response.status(404).json({ error: "account_not_found" });
          return;
        }
        response.status(200).json(account);
      } catch {
        response.status(500).json({ error: "account_lookup_failed" });
      }
    });

    app.post("/accounts/:id/deposits", async (request, response) => {
      const amount = request.body?.amount;
      if (typeof amount !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
        response.status(400).json({ error: "invalid_deposit_amount" });
        return;
      }

      try {
        const account = await accounts.deposit(request.params.id, amount);
        if (!account) {
          response.status(404).json({ error: "account_not_found" });
          return;
        }
        response.status(200).json(account);
      } catch {
        response.status(500).json({ error: "deposit_failed" });
      }
    });
  }

  return app;
}
