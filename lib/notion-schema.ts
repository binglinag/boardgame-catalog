import schema from "./notion-schema.json";

export const NOTION_SCHEMA = schema;

export const GAME_PROPS = schema.games.properties;
export const SESSION_PROPS = schema.sessions.properties;
export const PLAYER_PROPS = schema.players.properties;
export const BGG_URL_ALIASES = schema.games.bggUrlAliases;
