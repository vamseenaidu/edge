import { GroundResponse } from "../api/contract";

export type FinanceRule = {
  id: string;
  decision: GroundResponse["decision"];
  description: string;
  keywords: string[];
};

export type FinanceSchema = {
  version: "finance.v1";
  decision_precedence: GroundResponse["decision"][];
  refusal_zones: string[];
  rules: FinanceRule[];
};

export const financeSchema: FinanceSchema = {
  version: "finance.v1",
  decision_precedence: ["REFUSE", "ESCALATE", "ASK_CLARIFY", "PROCEED"],
  refusal_zones: [
    "Personalized investment advice or recommendations",
    "Portfolio allocation or rebalancing guidance",
    "Tax planning or tax advice",
  ],
  rules: [
    {
      id: "REFUSE_PERSONAL_ADVICE",
      decision: "REFUSE",
      description: "Personalized investment recommendations or portfolio guidance.",
      keywords: [
        "should i buy",
        "should i sell",
        "what stock should i invest",
        "recommend an etf",
        "recommend a stock",
        "what crypto should i buy",
        "allocate my portfolio",
        "my portfolio",
        "where should i invest",
      ],
    },
    {
      id: "REFUSE_TAX_PLANNING",
      decision: "REFUSE",
      description: "Tax planning or deductions guidance.",
      keywords: [
        "tax advice",
        "tax planning",
        "minimize my taxes",
        "reduce my taxes",
        "deduction",
        "deductions",
        "trading losses",
      ],
    },
    {
      id: "ESCALATE_FIDUCIARY_DUTY",
      decision: "ESCALATE",
      description: "Requests implying fiduciary duty or acting on behalf of a client.",
      keywords: [
        "fiduciary",
        "client funds",
        "client account",
        "power of attorney",
        "execute a trade",
        "manage my investments",
      ],
    },
    {
      id: "ESCALATE_IMMINENT_HARM",
      decision: "ESCALATE",
      description: "Imminent financial harm or emergency situations.",
      keywords: ["foreclosure", "margin call", "eviction", "bankruptcy"],
    },
    {
      id: "ASK_JURISDICTION",
      decision: "ASK_CLARIFY",
      description: "Jurisdiction or compliance ambiguity.",
      keywords: [
        "is it legal",
        "is this legal",
        "am i allowed",
        "is it allowed",
        "my country",
        "where i live",
        "regulations",
        "compliant",
        "need a license",
        "license to",
      ],
    },
  ],
};
