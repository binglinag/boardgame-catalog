import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { Player } from "@/types/player";
import { PLAYER_PROPS } from "@/lib/notion-schema";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  fetch,
});

const PLAYERS_DB_ID = process.env.NOTION_PLAYERS_DATABASE_ID ?? "";

// ============================================================
// 工具函数
// ============================================================

function isFullPage(page: unknown): page is PageObjectResponse {
  return typeof page === "object" && page !== null && "properties" in page;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPropType(prop: unknown, type: string): prop is Record<string, any> {
  return typeof prop === "object" && prop !== null && "type" in prop && (prop as Record<string, string>).type === type;
}

function getTitle(prop: unknown): string {
  if (isPropType(prop, "title")) {
    return (((prop as Record<string, unknown>).title ?? []) as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  }
  return "";
}

function getRichText(prop: unknown): string {
  if (isPropType(prop, "rich_text")) {
    return (((prop as Record<string, unknown>).rich_text ?? []) as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  }
  return "";
}

function mapPageToPlayer(page: PageObjectResponse): Player {
  const props = page.properties as Record<string, unknown>;
  return {
    id: page.id,
    name: getTitle(props[PLAYER_PROPS.name]),
    phone: getRichText(props[PLAYER_PROPS.phone]),
    notes: getRichText(props[PLAYER_PROPS.notes]),
  };
}

// ============================================================
// 读取
// ============================================================

export async function getAllPlayers(): Promise<Player[]> {
  const players: Player[] = [];

  if (!PLAYERS_DB_ID || !process.env.NOTION_API_KEY) {
    console.warn("[Notion Players] missing env vars");
    return players;
  }

  try {
    let cursor: string | null | undefined = undefined;
    do {
      const response = await notion.databases.query({
        database_id: PLAYERS_DB_ID,
        sorts: [{ property: PLAYER_PROPS.name, direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      for (const page of response.results) {
        if (isFullPage(page)) {
          try {
            players.push(mapPageToPlayer(page));
          } catch {
            // skip
          }
        }
      }
      cursor = response.next_cursor;
    } while (cursor);
  } catch (err) {
    console.error("[Notion Players] getAllPlayers failed:", err);
  }

  return players;
}

// ============================================================
// 写入
// ============================================================

export async function createPlayer(name: string, phone: string, notes: string): Promise<Player | null> {
  try {
    const response = await notion.pages.create({
      parent: { database_id: PLAYERS_DB_ID },
      properties: {
        [PLAYER_PROPS.name]: { title: [{ text: { content: name } }] },
        [PLAYER_PROPS.phone]: { rich_text: phone ? [{ text: { content: phone } }] : [] },
        [PLAYER_PROPS.notes]: { rich_text: notes ? [{ text: { content: notes } }] : [] },
      },
    });
    if (isFullPage(response)) return mapPageToPlayer(response);
    return null;
  } catch {
    return null;
  }
}
