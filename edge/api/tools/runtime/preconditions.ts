export type PreconditionContext = {
  satisfied: Set<string>;
};

export function arePreconditionsMet(required: string[] | undefined, ctx: PreconditionContext): boolean {
  if (!required || required.length === 0) return true;
  for (const label of required) {
    if (!ctx.satisfied.has(label)) return false;
  }
  return true;
}
