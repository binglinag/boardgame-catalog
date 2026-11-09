import type { Metadata } from "next";
import CoverMigrator from "@/components/cover-migrator";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "封面图批量迁移",
  robots: { index: false, follow: false },
};

export default function MigratePage() {
  return <CoverMigrator />;
}
