function canonicalizeValue(value: any): any {
  if (Array.isArray(value)) return value.map(canonicalizeValue);
  if (value && typeof value === "object") {
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = canonicalizeValue(value[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalizeJson<T>(value: T): T {
  return canonicalizeValue(value);
}

export function stringifyCanonical(value: any): string {
  return JSON.stringify(canonicalizeJson(value));
}
