import { failure, json, requireActor, requireSameOrigin, revokeMcpKey, rotateMcpKey } from "@/lib/reviews/server";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    return json({ key: await rotateMcpKey((await requireActor(request, true)).id) }, 201);
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    await revokeMcpKey((await requireActor(request, true)).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
