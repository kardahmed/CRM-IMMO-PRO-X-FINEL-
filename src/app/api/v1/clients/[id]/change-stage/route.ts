import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await currentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const { stage, lossReason } = body;

  if (!stage) {
    return NextResponse.json({ error: "Stage is required" }, { status: 400 });
  }

  if (stage === "PERDUE" && !lossReason) {
    return NextResponse.json(
      { error: "Loss reason is required for stage PERDUE" },
      { status: 400 },
    );
  }

  // TODO: Prisma update when DB is connected
  // await prisma.client.update({
  //   where: { id },
  //   data: {
  //     pipelineStage: stage,
  //     ...(lossReason ? { lossReason } : {}),
  //     stageEnteredAt: new Date(),
  //   },
  // });

  console.log(`[Pipeline] Client ${id} moved to stage ${stage}`, {
    lossReason,
    movedBy: user.id,
  });

  return NextResponse.json({
    success: true,
    clientId: id,
    newStage: stage,
  });
}
