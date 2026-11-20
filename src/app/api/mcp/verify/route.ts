import { failure, json, requireActor, ReviewError } from "@/lib/reviews/server";
import { connection } from "next/server";

export async function GET(request: Request) {
  await connection();
  try {
    if ((await requireActor(request)).method !== "mcp") throw new ReviewError(401, "An API key is required.");
    return json({ valid: true });
  } catch (error) {
    return failure(error);
  }
}
