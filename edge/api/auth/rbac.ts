export type EdgeRole = "platform_admin" | "policy_author" | "auditor" | "operator";

export type RoleRequirement = { anyOf: EdgeRole[] };

const allowedRoles: EdgeRole[] = ["platform_admin", "policy_author", "auditor", "operator"];
const allowedRoleSet = new Set<EdgeRole>(allowedRoles);

export function parseRoleHeader(raw: string | string[] | undefined): EdgeRole | null {
  if (raw === undefined) return null;

  const pickValue = (value: string | string[] | undefined): string | null => {
    if (value === undefined) return null;
    if (Array.isArray(value)) {
      const trimmed = value.map((entry) => entry.trim()).find((entry) => entry.length > 0);
      return trimmed ?? null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  };

  const candidate = pickValue(raw);
  if (!candidate) return null;

  const normalized = candidate.toLowerCase();
  if (allowedRoleSet.has(normalized as EdgeRole)) {
    return normalized as EdgeRole;
  }
  return null;
}

export function isRoleAllowed(role: EdgeRole | null, requirement: RoleRequirement): boolean {
  if (!role) return false;
  return requirement.anyOf.includes(role);
}
