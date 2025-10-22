// utils/createFakeJWT.ts

export function createFakeJWT(payload: object, secret: string): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const base64Encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const headerEncoded = base64Encode(header);
  const payloadEncoded = base64Encode(payload);
  const signature = btoa(secret).slice(0, 16); // Fake signature

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}
