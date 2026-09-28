export type ScenarioDefinition = {
  id: string;
  name: string;
  properties: string[];
  objective: string;
  executionMethod: string;
  expectedResult: string;
};

export const scenarios: ScenarioDefinition[] = [
  { id: "A01", name: "Duplicate transaction", properties: ["R3"], objective: "Repeat one logical transaction identity.", executionMethod: "Execute the same operation twice and compare state/effects.", expectedResult: "At most one financial effect." },
  { id: "A02", name: "Insufficient funds", properties: ["R1", "R2"], objective: "Attempt a transfer above available balance.", executionMethod: "Create controlled balance, submit oversized transfer, inspect final state.", expectedResult: "No invalid negative balance and no unexplained value." },
  { id: "A03", name: "Concurrent spending", properties: ["R2", "R4", "R5"], objective: "Race conflicting spends against one balance.", executionMethod: "Submit concurrent transfers and reconcile final state.", expectedResult: "Critical value invariants remain true." },
  { id: "A04", name: "Partial failure", properties: ["R1", "R4"], objective: "Observe behavior when transfer execution is interrupted.", executionMethod: "Use controlled failure injection when the environment supports it.", expectedResult: "No persistent one-sided transfer." },
  { id: "A05", name: "Unauthorized access", properties: ["R6"], objective: "Attempt protected access outside authorization scope.", executionMethod: "Execute with a principal lacking required authorization.", expectedResult: "Operation is denied/prevented and protected state is unchanged." },
  { id: "A06", name: "Boundary values", properties: ["R1", "R2", "R3", "R4", "R5", "R6"], objective: "Exercise documented domain boundaries.", executionMethod: "Execute supported minimum, maximum, zero and malformed inputs as applicable.", expectedResult: "Documented valid/invalid behavior without invariant violation." },
  { id: "A07", name: "Ambiguous-result retry", properties: ["R3", "R4", "R5"], objective: "Retry after an uncertain client outcome.", executionMethod: "Create or simulate an ambiguous outcome, then retry with the same identity.", expectedResult: "Retry does not duplicate financial effect." }
];
