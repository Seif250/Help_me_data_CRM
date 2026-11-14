/**
 * SalesSnap Protected Build Script
 * Bundles & obfuscates extension JS files into ./dist for safe distribution.
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const JavaScriptObfuscator = require("javascript-obfuscator");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const PROTECTED_JS = [
  "content.883ade9e.js",
  "salesforce-floating-bar.js",
  "quickform-editor-controls.js",
  "static/background/index.js"
];

const EXCLUDE_TOP_LEVEL = new Set([
  "dist",
  "node_modules",
  "server",
  "scripts",
  ".git",
  "package.json",
  "package-lock.json",
  ".gitignore"
]);

const copyRecursive = (src, dest) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
};

async function build() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE_TOP_LEVEL.has(entry)) continue;
    copyRecursive(path.join(ROOT, entry), path.join(DIST, entry));
  }

  for (const relPath of PROTECTED_JS) {
    const srcFile = path.join(ROOT, relPath);
    const outFile = path.join(DIST, relPath);
    if (!fs.existsSync(srcFile)) continue;

    console.log(`Protecting: ${relPath}`);
    const minified = await esbuild.build({
      entryPoints: [srcFile],
      bundle: false,
      minify: true,
      write: false,
      target: ["chrome116"]
    });

    const code = minified.outputFiles[0].text;
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.45,
      deadCodeInjection: false,
      debugProtection: false,
      disableConsoleOutput: true,
      identifierNamesGenerator: "hexadecimal",
      renameGlobals: false,
      selfDefending: true,
      splitStrings: true,
      splitStringsChunkLength: 8,
      stringArray: true,
      stringArrayEncoding: ["base64"],
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    }).getObfuscatedCode();

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, obfuscated, "utf8");
  }

  console.log(`\n✓ Protected build ready in: ${DIST}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

