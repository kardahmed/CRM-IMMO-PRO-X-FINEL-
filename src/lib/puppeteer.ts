import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";

/**
 * Lance un navigateur Puppeteer.
 * - En production (Vercel) : utilise @sparticuz/chromium
 * - En local : utilise le Chrome/Chromium installé sur la machine
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Serverless (Vercel / Lambda)
    const chromium = await import("@sparticuz/chromium");
    return puppeteer.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  }

  // Local dev — cherche Chrome/Chromium installé
  const possiblePaths = [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];

  let executablePath: string | undefined;
  for (const p of possiblePaths) {
    try {
      const { accessSync } = await import("fs");
      accessSync(p);
      executablePath = p;
      break;
    } catch {
      // Continue to next path
    }
  }

  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

/**
 * Génère un PDF à partir de HTML via Puppeteer.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
