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

    app.get("/transactions/:id", async (request, response) => {
      try {
        const transaction = await accounts.findTransaction(request.params.id);
        if (!transaction) {
          response.status(404).json({ error: "transaction_not_found" });
          return;
        }
        response.status(200).json(transaction);
      } catch {
        response.status(500).json({ error: "transaction_lookup_failed" });
      }
    });

    app.post("/accounts/:id/deposits", async (request, response) => {
      const amount = request.body?.amount;
      const transactionId = request.body?.transactionId;
      if (typeof transactionId !== "string" || transactionId.trim().length === 0 || transactionId.length > 200) {
        response.status(400).json({ error: "invalid_transaction_id" });
        return;
      }
      if (typeof amount !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
        response.status(400).json({ error: "invalid_deposit_amount" });
        return;
      }
      try {
        const account = await accounts.deposit(request.params.id, amount, transactionId);
        if (!account) {
          response.status(404).json({ error: "account_not_found" });
          return;
        }
        response.status(200).json(account);
      } catch {
        response.status(500).json({ error: "deposit_failed" });
      }
    });

    app.post("/transfers", async (request, response) => {
      const { sourceAccountId, destinationAccountId, amount, transactionId } = request.body ?? {};
      if (typeof sourceAccountId !== "string" || typeof destinationAccountId !== "string" || sourceAccountId === destinationAccountId) {
        response.status(400).json({ error: "invalid_transfer_accounts" });
        return;
      }
      if (typeof transactionId !== "string" || transactionId.trim().length === 0 || transactionId.length > 200) {
        response.status(400).json({ error: "invalid_transaction_id" });
        return;
      }
      if (typeof amount !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
        response.status(400).json({ error: "invalid_transfer_amount" });
        return;
      }
      try {
        const result = await accounts.transfer(sourceAccountId, destinationAccountId, amount, transactionId);
        if (!result) {
          response.status(409).json({ error: "transfer_not_applied" });
          return;
        }
        response.status(200).json(result);
      } catch {
        response.status(500).json({ error: "transfer_failed" });
      }
    });
  }

  return app;
}
