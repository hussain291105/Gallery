import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const photosDir = path.join(root, "public", "photos");

const allowed = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"
]);

const entries = await readdir(photosDir, { withFileTypes: true });

const files = entries
  .filter(
    (entry) =>
      entry.isFile() &&
      allowed.has(path.extname(entry.name).toLowerCase())
  )
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

await writeFile(
  path.join(photosDir, "manifest.json"),
  JSON.stringify(files, null, 2) + "\n"
);

console.log(`Photo manifest generated: ${files.length} image(s).`);
