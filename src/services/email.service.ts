import { prisma } from "@/lib/prisma";
import { decrypt, isEncrypted } from "@/lib/encryption";

// ============================================================================
// Types
// ============================================================================

export interface ISendEmailInput {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export interface ISendEmailResult {
  success: boolean;
  messageId: string | null;
  error?: string;
}

interface ISmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpFromName?: string;
  smtpSecure?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Recupere la config SMTP d'un tenant depuis settings (JSON).
 * Les cles sont stockees dans Tenant.settings.smtp.
 */
export async function getSmtpConfig(
  tenantId: string,
): Promise<ISmtpConfig | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true, name: true },
  });
  if (!tenant) return null;

  const settings = tenant.settings as Record<string, unknown>;
  const smtp = settings?.smtp as Partial<ISmtpConfig> | undefined;
  if (!smtp?.smtpHost || !smtp?.smtpUser || !smtp?.smtpPass) return null;

  // Decrypt password if encrypted
  const smtpPass = isEncrypted(smtp.smtpPass)
    ? await decrypt(smtp.smtpPass)
    : smtp.smtpPass;

  return {
    smtpHost: smtp.smtpHost,
    smtpPort: smtp.smtpPort ?? 587,
    smtpUser: smtp.smtpUser,
    smtpPass: smtpPass,
    smtpFrom: smtp.smtpFrom ?? smtp.smtpUser,
    smtpFromName: smtp.smtpFromName ?? tenant.name,
    smtpSecure: smtp.smtpSecure ?? false,
  };
}

// ============================================================================
// Send Email via native SMTP (nodemailer-free using fetch to SMTP relay)
// ============================================================================

/**
 * Envoie un email via SMTP en utilisant le module natif Node.js net/tls.
 * Pour simplifier et eviter les deps externes, on utilise un appel HTTP
 * vers un relay SMTP ou un fallback console en dev.
 *
 * En production, cette fonction utilise le protocole SMTP directement
 * via les modules Node.js natifs.
 */
export async function sendEmail(
  input: ISendEmailInput,
): Promise<ISendEmailResult> {
  const config = await getSmtpConfig(input.tenantId);

  if (!config) {
    // Pas de SMTP configure — log en console en dev, erreur en prod
    if (process.env.NODE_ENV === "development") {
      console.log("[EMAIL-DEV] Email non envoye (SMTP non configure):");
      console.log(`  To: ${input.to}`);
      console.log(`  Subject: ${input.subject}`);
      console.log(`  Body: ${input.body.substring(0, 200)}...`);
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }
    return {
      success: false,
      messageId: null,
      error:
        "SMTP non configure pour ce workspace. Ajoutez la configuration dans Parametres > Integrations.",
    };
  }

  try {
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${config.smtpHost}>`;

    // Build raw MIME message
    const fromHeader = config.smtpFromName
      ? `"${config.smtpFromName}" <${config.smtpFrom}>`
      : config.smtpFrom;

    const mimeMessage = [
      `From: ${fromHeader}`,
      `To: ${input.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
      `Message-ID: ${messageId}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      input.replyTo ? `Reply-To: ${input.replyTo}` : "",
      "",
      Buffer.from(wrapInHtmlTemplate(input.body, config.smtpFromName ?? "IMMO PRO-X")).toString("base64"),
    ]
      .filter(Boolean)
      .join("\r\n");

    // Use Node.js native net/tls for SMTP
    await sendViaSMTP(config, input.to, config.smtpFrom, mimeMessage);

    return { success: true, messageId };
  } catch (err) {
    return {
      success: false,
      messageId: null,
      error: err instanceof Error ? err.message : "Erreur envoi email",
    };
  }
}

// ============================================================================
// SMTP Protocol Implementation (minimal)
// ============================================================================

async function sendViaSMTP(
  config: ISmtpConfig,
  to: string,
  from: string,
  mimeMessage: string,
): Promise<void> {
  const net = await import("net");
  const tls = await import("tls");

  return new Promise((resolve, reject) => {
    const port = config.smtpPort;
    const isSecure = config.smtpSecure ?? port === 465;

    const commands = [
      `EHLO ${config.smtpHost}`,
      ...(isSecure ? [] : ["STARTTLS"]),
      `AUTH LOGIN`,
      Buffer.from(config.smtpUser).toString("base64"),
      Buffer.from(config.smtpPass).toString("base64"),
      `MAIL FROM:<${from}>`,
      `RCPT TO:<${to}>`,
      `DATA`,
      `${mimeMessage}\r\n.`,
      `QUIT`,
    ];

    let commandIndex = 0;
    let buffer = "";
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("SMTP timeout (30s)"));
    }, 30000);

    const handleData = (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line) continue;
        const code = parseInt(line.substring(0, 3), 10);

        // Multi-line response — wait for final line (no dash after code)
        if (line[3] === "-") continue;

        if (code >= 400) {
          clearTimeout(timeout);
          socket.destroy();
          reject(new Error(`SMTP error ${code}: ${line}`));
          return;
        }

        // Send next command
        if (commandIndex < commands.length) {
          const cmd = commands[commandIndex];
          commandIndex++;
          socket.write(cmd + "\r\n");
        } else {
          clearTimeout(timeout);
          socket.destroy();
          resolve();
        }
      }
    };

    let socket: import("net").Socket | import("tls").TLSSocket;

    if (isSecure) {
      socket = tls.connect(
        { host: config.smtpHost, port, rejectUnauthorized: true },
        () => {
          // Connection established, wait for greeting
        },
      );
    } else {
      socket = net.createConnection({ host: config.smtpHost, port });
    }

    socket.on("data", handleData);
    socket.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`SMTP connection error: ${err.message}`));
    });
  });
}

// ============================================================================
// HTML Template
// ============================================================================

function wrapInHtmlTemplate(body: string, companyName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:white;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden">
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:20px 24px">
        <h1 style="margin:0;color:white;font-size:18px;font-weight:700">${companyName}</h1>
      </div>
      <div style="padding:24px;color:#1e293b;font-size:14px;line-height:1.6">
        ${body}
      </div>
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
        <p style="margin:0;font-size:11px;color:#94a3b8">Envoye via CRM IMMO PRO-X</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
