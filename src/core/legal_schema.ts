import { GroundResponse } from "../api/contract";

export type LegalRule = {
  id: string;
  decision: GroundResponse["decision"];
  description: string;
  keywords: string[];
};

export type LegalSchema = {
  version: "legal.v0";
  decision_precedence: GroundResponse["decision"][];
  refusal_zones: string[];
  rules: LegalRule[];
};

export const legalSchema: LegalSchema = {
  version: "legal.v0",
  decision_precedence: ["REFUSE", "ESCALATE", "ASK_CLARIFY", "PROCEED"],
  refusal_zones: [
    "Requests for legal advice or strategy",
    "Drafting contracts, wills, pleadings, or notices",
    "Interpretation of laws, regulations, or case law",
    "Jurisdiction-specific legal questions",
  ],
  rules: [
    {
      id: "REFUSE_LEGAL_ADVICE",
      decision: "REFUSE",
      description: "Personalized legal advice or strategy requests.",
      keywords: [
        "need legal advice",
        "legal advice on",
        "legal advice for",
        "give me legal advice",
        "advise me",
        "should i sue",
        "can i sue",
        "should i sign",
        "what should my lawyer do",
        "what should my attorney do",
        "should my lawyer",
        "what should my attorney",
        "is it legal",
      ],
    },
    {
      id: "REFUSE_DRAFTING",
      decision: "REFUSE",
      description: "Drafting or reviewing legal documents.",
      keywords: [
        "draft a contract",
        "write a contract",
        "contract template",
        "draft an agreement",
        "write an agreement",
        "draft a will",
        "write a will",
        "draft a pleading",
        "draft a complaint",
        "draft a motion",
        "draft a notice",
        "cease and desist letter",
        "terms and conditions",
        "privacy policy",
        "employment contract",
        "review my contract",
        "is this contract enforceable",
      ],
    },
    {
      id: "REFUSE_LAW_INTERPRETATION",
      decision: "REFUSE",
      description: "Interpretation of laws, regulations, or case law.",
      keywords: [
        "interpret the law",
        "interpret this law",
        "interpret this regulation",
        "interpretation of the law",
        "what does the law say",
        "what does this law say",
        "what does the statute say",
        "what does regulation say",
        "case law says",
        "case law on",
        "regulation on",
        "regulations on",
      ],
    },
    {
      id: "REFUSE_JURISDICTION",
      decision: "REFUSE",
      description: "Jurisdiction-specific legal guidance.",
      keywords: [
        "in california",
        "in texas",
        "in new york",
        "in the united states",
        "in the us",
        "in the uk",
        "in england",
        "in canada",
        "in australia",
        "in india",
        "in singapore",
        "in my state",
        "in my country",
        "under us law",
        "under uk law",
        "under california law",
      ],
    },
    {
      id: "ESCALATE_LITIGATION",
      decision: "ESCALATE",
      description: "Active disputes or litigation risk.",
      keywords: [
        "i am being sued",
        "i'm being sued",
        "lawsuit against me",
        "served with a subpoena",
        "received a subpoena",
        "subpoena",
        "summons",
        "court date",
        "legal notice",
        "served with papers",
      ],
    },
    {
      id: "ESCALATE_CRIMINAL",
      decision: "ESCALATE",
      description: "Criminal implications or investigations.",
      keywords: [
        "arrested",
        "charged with",
        "criminal charges",
        "under investigation",
        "police investigation",
        "fraud investigation",
      ],
    },
    {
      id: "ESCALATE_REGULATORY",
      decision: "ESCALATE",
      description: "Regulatory enforcement scenarios.",
      keywords: [
        "regulatory enforcement",
        "enforcement action",
        "sec investigation",
        "ftc investigation",
        "regulator investigation",
        "compliance investigation",
      ],
    },
    {
      id: "ASK_THIRD_PARTY",
      decision: "ASK_CLARIFY",
      description: "Third-party legal situations.",
      keywords: [
        "my friend",
        "my coworker",
        "my neighbor",
        "my sibling",
        "my family member",
        "my roommate",
      ],
    },
    {
      id: "ASK_AMBIGUOUS_PROCESS",
      decision: "ASK_CLARIFY",
      description: "Ambiguous references to legal process without intent.",
      keywords: ["legal process", "legal issue", "going to court", "go to court", "court process"],
    },
  ],
};
