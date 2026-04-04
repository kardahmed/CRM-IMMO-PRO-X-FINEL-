import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Renders a React-PDF element tree to a PDF Buffer.
 * The element must be a <Document> from @react-pdf/renderer.
 */
export async function renderDocumentToPdf(
  element: ReactElement,
): Promise<Buffer> {
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

/**
 * Converts an HTML string to a simple PDF buffer.
 * Uses @react-pdf/renderer with a basic Text wrapper.
 * For rich HTML documents, prefer building React-PDF components directly.
 *
 * This is a lightweight replacement for Puppeteer's page.pdf().
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // Dynamic import to avoid bundling issues in client components
  const { Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const { createElement } = await import("react");

  // Strip HTML tags and convert to plain text sections
  const plainText = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<td[^>]*>/gi, "  |  ")
    .replace(/<th[^>]*>/gi, "  |  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
    text: { color: "#1e293b" },
  });

  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        null,
        ...plainText.split("\n").map((line, i) =>
          createElement(Text, { key: i, style: styles.text }, line),
        ),
      ),
    ),
  );

  return renderDocumentToPdf(doc);
}
