// Checks the committed published bundle (ops/): every local asset the page references must exist, and the page must be
// servable by GitHub Pages. Dependency-free. Usage: node scripts/check-published.mjs [dir=ops]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "ops";
const BASE = "/iboss-stat-page/";
const failures = [];

const indexPath = join(dir, "index.html");
if (!existsSync(indexPath)) {
  console.error(`FAIL ${indexPath} is missing`);
  process.exit(1);
}
const html = readFileSync(indexPath, "utf8");
if (!/<title>[^<]+<\/title>/i.test(html)) failures.push("index.html has no non-empty <title>");
if (!existsSync(join(dir, ".nojekyll"))) failures.push(`${dir}/.nojekyll is missing (Pages would run Jekyll over the bundle)`);

const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
let checked = 0;
for (const ref of refs) {
  if (/^(https?:)?\/\//i.test(ref) || ref.startsWith("data:") || ref.startsWith("#") || ref.startsWith("mailto:")) continue;
  if (!ref.startsWith(BASE)) {
    failures.push(`local reference "${ref}" is outside the Pages base ${BASE}`);
    continue;
  }
  const file = join(dir, ref.slice(BASE.length).split(/[?#]/)[0]);
  checked += 1;
  if (!existsSync(file)) failures.push(`"${ref}" -> ${file} does not exist`);
}
if (checked === 0) failures.push("index.html references no local assets (expected the built JS/CSS)");

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`ok: ${checked} local asset reference(s) in ${indexPath} resolve; title and .nojekyll present`);
