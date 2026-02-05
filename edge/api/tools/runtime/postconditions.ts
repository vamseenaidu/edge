export type PostconditionResult = {
  satisfied: Set<string>;
};

export function arePostconditionsMet(required: string[] | undefined, res: PostconditionResult): boolean {
  if (!required || required.length === 0) return true;
  for (const label of required) {
    if (!res.satisfied.has(label)) return false;
  }
  return true;
}
