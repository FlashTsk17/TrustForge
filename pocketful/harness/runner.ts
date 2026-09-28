import { scenarios, type ScenarioDefinition } from "./scenarios.js";

export type ScenarioStatus = "READY" | "BLOCKED" | "INCONCLUSIVE" | "PASS" | "FAIL";

export type ScenarioResult = {
  scenarioId: string;
  status: ScenarioStatus;
  expectedResult: string;
  observedResult?: string;
  limitation?: string;
};

export function listScenarios(): ScenarioDefinition[] {
  return scenarios;
}

export function buildUnexecutedResults(): ScenarioResult[] {
  return scenarios.map((scenario) => ({
    scenarioId: scenario.id,
    status: "INCONCLUSIVE",
    expectedResult: scenario.expectedResult,
    limitation: "Runtime execution has not been performed by this environment."
  }));
}
