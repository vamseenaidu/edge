export type EdgeRole = "auditor" | "policy_author" | "platform_admin" | "operator";

const ROLE_KEY = "edge_role";
const VALID_ROLES: EdgeRole[] = ["auditor", "policy_author", "platform_admin", "operator"];

function parseRole(raw: string | null): EdgeRole | null {
  if (!raw) return null;
  return VALID_ROLES.includes(raw as EdgeRole) ? (raw as EdgeRole) : null;
}

export function getRole(): EdgeRole {
  if (typeof window === "undefined") return "auditor";

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = parseRole(params.get("role"));
    if (fromQuery) {
      setRole(fromQuery);
      return fromQuery;
    }
  } catch {
    // ignore URL parsing issues
  }

  try {
    const stored = parseRole(window.localStorage.getItem(ROLE_KEY));
    if (stored) return stored;
  } catch {
    // ignore storage access issues
  }

  return "auditor";
}

export function setRole(role: EdgeRole): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROLE_KEY, role);
  } catch {
    // ignore storage failures
  }
}
