// Xác thực đơn giản cho app 1-người-dùng: không có hệ thống tài khoản,
// chỉ kiểm tra 1 mật khẩu (APP_PASSWORD) và phát session token có chữ ký HMAC.
// Viết bằng Web Crypto (crypto.subtle) để chạy được cả ở Node runtime lẫn Edge middleware.

const encoder = new TextEncoder();
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 ngày

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function createSessionToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  return `${timestamp}.${toHex(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const [timestamp, sig] = token.split(".");
  if (!timestamp || !sig) return false;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;

  const key = await getKey(secret);
  const expectedSig = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp)));
  return timingSafeEqual(sig, expectedSig);
}

export const SESSION_COOKIE_NAME = "session";
