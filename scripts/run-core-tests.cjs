const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const rootDir = path.join(__dirname, "..");
const testsDir = path.join(rootDir, "tests");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const absolute = path.join(rootDir, request.slice(2));
    const candidates = [absolute, `${absolute}.ts`, `${absolute}.tsx`, `${absolute}.json`];
    const match = candidates.find((candidate) => fs.existsSync(candidate));
    if (match) {
      return originalResolveFilename.call(this, match, parent, isMain, options);
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

function registerTypeScript(extension) {
  require.extensions[extension] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.Preserve,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}

registerTypeScript(".ts");
registerTypeScript(".tsx");

function findTestFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".test.ts"))
    .map((name) => path.join(dir, name));
}

async function main() {
  const files = findTestFiles(testsDir);
  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const mod = require(file);
    const tests = mod.tests ?? [];

    for (const testCase of tests) {
      try {
        await testCase.run();
        passed++;
        console.log(`OK  ${testCase.name}`);
      } catch (error) {
        failed++;
        console.error(`FAIL ${testCase.name}`);
        console.error(error);
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main();
