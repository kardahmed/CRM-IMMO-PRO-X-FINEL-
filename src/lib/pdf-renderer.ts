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
