#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .sort();

const pageImageBudgets = {
  "index.html": 6,
  "projects.html": 24,
  "personal.html": 14,
  "travel-gallery.html": 6,
  "travel-map.html": 6
};

const failures = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function attrsFrom(tag) {
  const attrs = {};
  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrPattern.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function isLocalAsset(value) {
  return value &&
    !value.includes("+") &&
    !value.includes("{{") &&
    !value.startsWith("http://") &&
    !value.startsWith("https://") &&
    !value.startsWith("data:") &&
    !value.startsWith("#") &&
    !value.startsWith("mailto:") &&
    !value.startsWith("tel:");
}

function checkAsset(file, src, label) {
  if (!isLocalAsset(src)) {
    return;
  }
  const clean = src.split("?")[0].split("#")[0];
  const target = path.resolve(root, clean);
  if (!target.startsWith(root) || !fs.existsSync(target)) {
    fail(file, `${label} not found: ${src}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/i);
  const metaTags = Array.from(html.matchAll(/<meta\b[^>]*>/gi)).map((match) => attrsFrom(match[0]));
  const linkTags = Array.from(html.matchAll(/<link\b[^>]*>/gi)).map((match) => attrsFrom(match[0]));
  const description = metaTags.find((attrs) => (attrs.name || "").toLowerCase() === "description");
  const canonical = linkTags.find((attrs) => (attrs.rel || "").toLowerCase() === "canonical");

  if (!title || title[1].trim().length < 12) {
    fail(file, "missing or weak <title>");
  }
  if (!description || (description.content || "").trim().length < 50) {
    fail(file, "missing or weak meta description");
  }
  if (!canonical) {
    fail(file, "missing canonical link");
  }

  const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((match) => match[0]);
  const pageBudget = pageImageBudgets[file];
  const eagerCount = imgTags.filter((tag) => /loading=["']eager["']/i.test(tag)).length;
  if (pageBudget && eagerCount > pageBudget) {
    fail(file, `too many eager images (${eagerCount}/${pageBudget})`);
  }

  for (const tag of imgTags) {
    const attrs = attrsFrom(tag);
    if (!("alt" in attrs)) {
      fail(file, `image missing alt: ${tag.slice(0, 120)}`);
    }
    checkAsset(file, attrs.src || attrs["data-src"], "image");
  }

  for (const attrs of linkTags) {
    if (attrs.href && /^(stylesheet|icon|apple-touch-icon|manifest|preload)$/i.test(attrs.rel || "")) {
      checkAsset(file, attrs.href, "linked asset");
    }
  }
}

if (failures.length) {
  console.error(`Static site check failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static site check passed for ${htmlFiles.length} HTML pages.`);
