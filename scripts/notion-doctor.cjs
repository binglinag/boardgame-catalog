const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("@notionhq/client");

const schemaPath = path.join(__dirname, "..", "lib", "notion-schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function logOk(message) {
  console.log(`OK  ${message}`);
}

function logWarn(message) {
  console.warn(`WARN ${message}`);
}

function logFail(message) {
  console.error(`FAIL ${message}`);
}

function checkEnv() {
  const requiredEnv = [
    "NOTION_API_KEY",
    schema.games.env,
    schema.sessions.env,
    schema.players.env,
  ];

  const missing = requiredEnv.filter((key) => !process.env[key]);
  for (const key of requiredEnv) {
    if (process.env[key]) {
      logOk(`${key} is set`);
    } else {
      logFail(`${key} is missing`);
    }
  }

  if (!process.env.ADMIN_PASSWORD) {
    logWarn("ADMIN_PASSWORD is not set, write actions are open to anyone with access");
  }

  return missing;
}

async function checkDatabase(tableKey, table) {
  const databaseId = process.env[table.env];
  if (!databaseId || !process.env.NOTION_API_KEY) {
    logWarn(`${table.name}: skipped Notion schema check because env vars are missing`);
    return 0;
  }

  let failures = 0;

  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const properties = db.properties ?? {};

    for (const [propertyName, expectedType] of Object.entries(table.requiredTypes)) {
      const actual = properties[propertyName];
      if (!actual) {
        logFail(`${table.name}: missing property "${propertyName}" (${expectedType})`);
        failures++;
        continue;
      }

      if (actual.type !== expectedType) {
        logFail(
          `${table.name}: property "${propertyName}" should be ${expectedType}, got ${actual.type}`
        );
        failures++;
        continue;
      }

      logOk(`${table.name}: "${propertyName}" is ${expectedType}`);
    }

    if (tableKey === "games") {
      const hasBggUrlAlias = table.bggUrlAliases.some((name) => properties[name]?.type === "url");
      if (hasBggUrlAlias) {
        logOk(`${table.name}: BGG URL property is available`);
      } else {
        logWarn(`${table.name}: no BGG URL alias with url type was found`);
      }
    }
  } catch (error) {
    failures++;
    const message = error instanceof Error ? error.message : String(error);
    logFail(`${table.name}: failed to retrieve database - ${message}`);
  }

  return failures;
}

async function main() {
  console.log("Checking boardgame-catalog Notion setup...\n");

  const missingEnv = checkEnv();
  let failures = missingEnv.length;

  console.log("");
  for (const [tableKey, table] of Object.entries(schema)) {
    failures += await checkDatabase(tableKey, table);
  }

  console.log("");
  if (failures > 0) {
    logFail(`${failures} issue(s) found`);
    process.exitCode = 1;
  } else {
    logOk("Notion setup looks good");
  }
}

main();
