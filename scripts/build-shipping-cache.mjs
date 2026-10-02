import { readFile, writeFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const out = path.resolve(process.argv[2] || "out");
try {
  await access(path.join(out, "index.html"));
} catch {
  console.log("Static export not present; skipping shipping cache generation.");
  process.exit(0);
}
const template = await readFile(
  new URL("./shipping-cache-worker.template.js", import.meta.url),
  "utf8",
);
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
async function list(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? list(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
    )
  ).flat();
}
const files = (await list(path.join(out, "_next/static")))
  .filter((f) => /\.(js|css|woff2?)$/.test(f))
  .sort();
const assets = await Promise.all(
  files.map(async (file) => ({
    // Match the encoded request paths used by browsers and the production host.
    url: "/" + path.relative(out, file).split(path.sep).map(encodeURIComponent).join("/"),
    sha256: hash(await readFile(file)),
  })),
);
assets.push({
  url: "/vendor/crypto-worker.js",
  sha256: hash(await readFile(path.join(out, "vendor/crypto-worker.js"))),
});
const shells = await Promise.all(
  [
    ["/", "index.html"],
    ["/my-shipping", "my-shipping.html"],
  ].map(async ([url, file]) => ({
    url,
    file,
    html: (await readFile(path.join(out, file), "utf8")).replace(
      /<meta name="ns-shell-version" content="[^"]*"\s*\/?\s*>/g,
      "",
    ),
  })),
);
const version = hash(
  template + JSON.stringify(assets) + shells.map((s) => s.html).join(""),
).slice(0, 20);
for (const shell of shells) {
  await writeFile(
    path.join(out, shell.file),
    shell.html.replace(
      "</head>",
      `<meta name="ns-shell-version" content="${version}"/></head>`,
    ),
  );
}
const manifest = [...shells.map(({ url }) => ({ url })), ...assets];
await writeFile(
  path.join(out, "shipping-cache-worker.js"),
  template
    .replace("__VERSION__", JSON.stringify(version))
    .replace("__ASSETS__", JSON.stringify(manifest)),
);
console.log(
  `Shipping UI cache ${version}: ${manifest.length} public resources, no customer data.`,
);
