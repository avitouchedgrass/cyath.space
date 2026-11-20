import { createCanvas, failure, json, listCanvases, readJson, requireActor, requireSameOrigin } from "@/lib/reviews/server";

export async function GET(request: Request) {
  try {
    return json({ projects: await listCanvases(await requireActor(request)) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await requireActor(request);
    return json(await createCanvas(await readJson(request), actor), 201);
  } catch (error) {
    return failure(error);
  }
}
