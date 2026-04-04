import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Meta (WhatsApp / Facebook) webhook X-Hub-Signature-256 header.
 *
 * Meta signs every POST payload with HMAC-SHA256 using the App Secret.
 * The signature is sent in the X-Hub-Signature-256 header as "sha256=<hex>".
 *
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSig = signatureHeader.slice("sha256=".length);
  const computedSig = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(expectedSig, "hex"),
      Buffer.from(computedSig, "hex"),
    );
  } catch {
    return false;
  }
}
