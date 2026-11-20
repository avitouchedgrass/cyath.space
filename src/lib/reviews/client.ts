export class ReviewRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function reviewRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, cache: "no-store" });
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new ReviewRequestError(0, "Could not reach Cyath. Check your connection and try again.");
  }
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ReviewRequestError(response.status, data?.error || "Cyath could not complete that request. Try again.");
  }
  if (response.status !== 204 && data === undefined) {
    throw new ReviewRequestError(response.status, "Cyath returned an unexpected response. Try again.");
  }
  return data as T;
}

export function jsonRequest(method: string, body: unknown, approval?: string): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(approval ? { "X-Cyath-Approval": approval } : {}),
    },
    body: JSON.stringify(body),
  };
}

export function reviewErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

export async function openBilling(action: "monthly" | "annual" | "manage") {
  const result = await reviewRequest<{ url: string }>("/api/billing", jsonRequest("POST", { action }));
  window.location.assign(result.url);
}
