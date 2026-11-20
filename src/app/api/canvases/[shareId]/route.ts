import {
  changeCanvas, deleteCanvas, failure, getActor, json, loadCanvas, readJson, requireActor, requireSameOrigin,
} from "@/lib/reviews/server";

type Context = { params: Promise<{ shareId: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const { shareId } = await params;
    return json(await loadCanvas(shareId, await getActor(request), request.headers.get("X-Cyath-Approval")));
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    requireSameOrigin(request);
    const { shareId } = await params;
    return json(await changeCanvas(shareId, await readJson(request), await getActor(request), request.headers.get("X-Cyath-Approval")));
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    requireSameOrigin(request);
    const { shareId } = await params;
    await deleteCanvas(shareId, await requireActor(request, true));
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
