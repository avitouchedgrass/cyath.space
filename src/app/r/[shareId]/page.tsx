import { Suspense } from "react";
import { ReviewCanvas } from "@/components/review/ReviewCanvas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review · Cyath",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function ReviewCanvasFetcher({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  return <ReviewCanvas shareId={shareId} />;
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Mounting staging session...</span>
          </div>
        </div>
      }
    >
      <ReviewCanvasFetcher params={params} />
    </Suspense>
  );
}
