export type PolicyRecord = {
  version: string;
  domain: string;
  summary: string;
  text: string;
  status: "draft" | "published";
};

export type PolicyDraftInput = {
  version: string;
  domain: string;
  summary: string;
  text: string;
};
