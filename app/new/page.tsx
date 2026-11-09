import type { Metadata } from "next";
import { getGameFieldDefs, orderFieldDefs } from "@/lib/notion-fields";
import GameCreateForm from "@/components/game-create-form";

export const runtime = "edge";
// 每次进来都重新读表结构，避免 Notion 加了新列后页面还是旧表单
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新增桌游",
  robots: { index: false, follow: false },
};

export default async function NewGamePage() {
  // 读取真实表结构后按录入习惯重排：常用字段在前，不常填的沉底
  const fields = orderFieldDefs(await getGameFieldDefs());
  return <GameCreateForm fields={fields} />;
}
