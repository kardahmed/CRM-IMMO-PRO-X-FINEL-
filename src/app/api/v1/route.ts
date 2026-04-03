import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { version: "1.0.0", status: "ok" },
  });
}
