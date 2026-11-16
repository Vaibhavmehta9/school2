import fs from "node:fs";
const html = fs.readFileSync("dist/index.html", "utf8");
const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!match) {
  console.error("FAIL: JSON-LD block not found in dist/index.html");
  process.exit(1);
}
try {
  const data = JSON.parse(match[1]);
  console.log("PASS: JSON-LD parsed successfully!");
  console.log("Type:", data["@type"]);
  console.log("Name:", data.name);
  console.log("Founding Date:", data.foundingDate);
  console.log("Address:", data.address.addressLocality, data.address.addressRegion);
} catch (err) {
  console.error("FAIL: Invalid JSON in JSON-LD script:", err);
  process.exit(1);
}
