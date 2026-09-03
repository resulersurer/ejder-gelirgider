import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "FINANCE" | "VIEWER";
export type SessionPayload = { userId: string; email: string; name: string; role: Role };

export const SESSION_COOKIE = "ejder_session";

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET yapılandırılmadı.");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
