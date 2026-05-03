function toBase64Url(input: object) {
  return btoa(JSON.stringify(input))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createFakeJwt(payload: Record<string, unknown>) {
  const header = toBase64Url({ alg: "HS256", typ: "JWT" });
  const body = toBase64Url(payload);

  return `${header}.${body}.signature`;
}
