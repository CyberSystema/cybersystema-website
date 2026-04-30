// Cloudflare Turnstile server-side verification. If TURNSTILE_SECRET_KEY is
// unset the verifier returns "skipped" so local/dev flows continue to work.

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerification =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false }
  | { ok: false; reason: string };

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | undefined,
  secretKey: string | undefined,
): Promise<TurnstileVerification> {
  if (!secretKey) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams({
    secret: secretKey,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await response.json()) as { success?: boolean; ["error-codes"]?: string[] };
    if (data.success === true) return { ok: true, skipped: false };
    return { ok: false, reason: (data["error-codes"] ?? []).join(",") || "verification-failed" };
  } catch {
    return { ok: false, reason: "verification-network-error" };
  }
}
