import type { Metadata } from "next";
import IdBackfill from "@/components/id-backfill";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "对局 ID 回填",
  robots: { index: false, follow: false },
};

export default function BackfillPage() {
  return <IdBackfill />;
}
