#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let sharp;
try {
  sharp = require("sharp");
} catch (error) {
  console.error("This script requires the sharp package. Set NODE_PATH to a runtime that provides sharp.");
  process.exit(1);
}

function numberOption(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  if (!value) {
    return fallback;
  }
  const parsed = Number(value.slice(prefix.length));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${name} value`);
  }
  return parsed;
}

const root = path.resolve(__dirname, "..");
const maxEdge = numberOption("max-edge", 2560);
const quality = numberOption("quality", 85);
const dryRun = process.argv.includes("--dry-run");
const quiet = process.argv.includes("--quiet");
const dataCode = fs.readFileSync(path.join(root, "travel-data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(dataCode, context, { filename: "travel-data.js" });

const sources = [...new Set(
  context.window.travelData.places.flatMap((place) =>
    (place.photos || []).map((photo) => photo.src)
  )
)];

async function optimize(source) {
  const absolute = path.join(root, source);
  const extension = path.extname(absolute).toLowerCase();
  if (extension !== ".jpg" && extension !== ".jpeg") {
    return { source, status: "skipped-format", before: 0, after: 0 };
  }

  const before = fs.statSync(absolute).size;
  const temporary = `${absolute}.optimize-${process.pid}.tmp`;

  if (dryRun) {
    const metadata = await sharp(absolute).metadata();
    return {
      source,
      status: Math.max(metadata.width || 0, metadata.height || 0) > maxEdge ? "would-resize" : "would-recompress",
      before,
      after: before
    };
  }

  try {
    await sharp(absolute)
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({
        quality,
        mozjpeg: true
      })
      .withMetadata({ orientation: 1 })
      .toFile(temporary);

    const after = fs.statSync(temporary).size;
    if (after >= before) {
      fs.unlinkSync(temporary);
      return { source, status: "kept-smaller-original", before, after: before };
    }

    fs.renameSync(temporary, absolute);
    return { source, status: "optimized", before, after };
  } catch (error) {
    if (fs.existsSync(temporary)) {
      fs.unlinkSync(temporary);
    }
    throw new Error(`${source}: ${error.message}`);
  }
}

(async function main() {
  const results = [];
  for (const source of sources) {
    const result = await optimize(source);
    results.push(result);
    if (!dryRun && !quiet && result.status === "optimized") {
      console.log(`${source}: ${(result.before / 1048576).toFixed(2)} MB -> ${(result.after / 1048576).toFixed(2)} MB`);
    }
  }

  const before = results.reduce((total, result) => total + result.before, 0);
  const after = results.reduce((total, result) => total + result.after, 0);
  const optimized = results.filter((result) => result.status === "optimized").length;
  const summary = {
    files: results.length,
    optimized,
    dryRun,
    beforeMB: Number((before / 1048576).toFixed(1)),
    afterMB: Number((after / 1048576).toFixed(1)),
    savedMB: Number(((before - after) / 1048576).toFixed(1))
  };
  console.log(JSON.stringify(summary, null, 2));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
