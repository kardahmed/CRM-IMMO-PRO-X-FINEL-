import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CRM IMMO PRO X";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          IMMO PRO-X
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.8)",
            marginTop: 16,
          }}
        >
          CRM immobilier multi-tenant
        </div>
      </div>
    ),
    { ...size }
  );
}
