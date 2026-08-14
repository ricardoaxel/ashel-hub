import { test, expect } from "@playwright/test";
import fs from "fs";

const BASE = "http://localhost:8000";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const pages = [
  { path: "/", id: "index" },
  { path: "/project.html?id=oshira", id: "project" },
  { path: "/illustrations.html", id: "illustrations" },
  { path: "/other.html", id: "other" },
];

const outDir = "tests/audit-output";
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(`${outDir}/screenshots`, { recursive: true });

function formatFindings(findings) {
  const groups = {};
  for (const item of findings) {
    if (!groups[item.severity]) groups[item.severity] = [];
    groups[item.severity].push(item);
  }
  const order = ["error", "warning", "info", "ok"];
  let out = `# Audit Findings\n\n`;
  for (const sev of order) {
    const items = groups[sev] || [];
    out += `## ${sev.toUpperCase()} (${items.length})\n\n`;
    for (const it of items) {
      out += `- **${it.page}** (${it.viewport}) — **${it.category}**: ${it.title}`;
      if (it.detail) out += `\n  - ${it.detail}`;
      out += `\n`;
    }
    out += `\n`;
  }
  return out;
}

async function waitForPageReady(page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch (e) {}
  try {
    await page.waitForFunction(
      () => {
        const el = document.getElementById("page-loader");
        return !el || el.style.display === "none" || el.style.opacity === "0";
      },
      { timeout: 10000 }
    );
  } catch (e) {}
  await page.waitForTimeout(500);
}

async function auditPage(page, { path, id }, viewport) {
  const findings = [];
  const add = (category, severity, title, detail = "") => {
    findings.push({ page: id, viewport: viewport.name, category, severity, title, detail });
  };

  const consoleLogs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleLogs.push({ type: "pageerror", text: err.message });
  });

  const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  if (!response || response.status() >= 400) {
    add("network", "error", `HTTP ${response?.status() || "no response"}`);
  }

  await waitForPageReady(page);

  const shotPath = `${outDir}/screenshots/${id}-${viewport.name}.png`;
  await page.screenshot({ path: shotPath, fullPage: true });
  add("screenshot", "ok", `Saved ${shotPath}`);

  const title = await page.title();
  if (!title || title === "") add("meta", "warning", "Missing page title");
  else add("meta", "ok", `Title: "${title}"`);

  const lang = await page.evaluate(() => document.documentElement.lang);
  if (!lang) add("a11y", "warning", "Missing lang attribute on <html>");

  const viewportMeta = await page.evaluate(() => {
    const el = document.querySelector('meta[name="viewport"]');
    return el ? el.content : null;
  });
  if (!viewportMeta) add("meta", "warning", "Missing viewport meta tag");

  const brokenImages = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll("img"));
    const broken = [];
    for (const img of imgs) {
      const rect = img.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      // Only flag images that are in viewport or eager-loaded; lazy images below fold may not have loaded yet.
      if ((inViewport || img.loading === 'eager') && (!img.complete || img.naturalWidth === 0)) {
        broken.push({ src: img.src, alt: img.alt });
      }
    }
    return broken;
  });
  if (brokenImages.length) {
    for (const img of brokenImages.slice(0, 5)) {
      add("images", "error", `Broken image`, `${img.src} (alt: ${img.alt || "none"})`);
    }
  } else {
    add("images", "ok", "All visible images loaded");
  }

  const missingAlt = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => !img.alt && !img.closest("[aria-label], [aria-labelledby]"))
      .map((img) => img.src)
  );
  if (missingAlt.length) {
    for (const src of missingAlt.slice(0, 5)) {
      add("a11y", "warning", `Image missing alt text`, src);
    }
  } else {
    add("a11y", "ok", "Images have alt text");
  }

  const overflow = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("body *"));
    const offenders = [];
    for (const el of all) {
      if (el.classList.contains('marquee-content')) continue;
      const style = window.getComputedStyle(el);
      if (style.overflow === "hidden") {
        const rect = el.getBoundingClientRect();
        const text = el.textContent?.slice(0, 80) || "";
        if (rect.width > 0 && rect.height > 0 && el.scrollWidth > rect.width + 2) {
          offenders.push({ tag: el.tagName, text, scrollWidth: el.scrollWidth, width: rect.width });
        }
      }
    }
    return offenders.slice(0, 5);
  });
  if (overflow.length) {
    for (const o of overflow) {
      add("layout", "warning", `Possible text overflow`, `${o.tag}: "${o.text}" (${Math.round(o.width)}px / ${Math.round(o.scrollWidth)}px)`);
    }
  }

  if (viewport.name === "desktop") {
    const cursorDot = await page.locator(".cursor-dot").count();
    const cursorRing = await page.locator(".cursor-ring").count();
    if (cursorDot && cursorRing) add("interaction", "ok", "Custom cursor elements present");
    else add("interaction", "warning", "Custom cursor elements missing");
  }

  if (viewport.name === "mobile") {
    const menuBtn = page.locator(".mobile-menu-btn");
    if (await menuBtn.count()) add("interaction", "ok", "Mobile menu button present");
    else add("interaction", "warning", "Mobile menu button missing");
  }

  if (id === "index") {
    const sections = ["#projects", "#illustrations", "#gallery", "#videos", "#about", "#contact"];
    for (const sel of sections) {
      const el = page.locator(sel);
      const visible = await el.isVisible().catch(() => false);
      if (visible) add("structure", "ok", `Section ${sel} visible`);
      else add("structure", "warning", `Section ${sel} not visible`);
    }
  }

  const projectCards = await page.locator(".project-card").count();
  if (id === "index") {
    if (projectCards > 0) add("content", "ok", `${projectCards} project card(s) rendered`);
    else add("content", "error", "No project cards rendered");
  }

  if (id === "illustrations") {
    const items = await page.locator(".ill-grid-item").count();
    if (items > 0) add("content", "ok", `${items} illustration item(s) rendered`);
    else add("content", "warning", "No illustration items rendered");
  }

  if (id === "project") {
    const chips = await page.locator(".project-category-chip").count();
    if (chips > 0) add("content", "ok", `${chips} category chip(s) rendered`);
  }

  const errors = consoleLogs.filter((l) => l.type === "error" || l.type === "pageerror");
  const warnings = consoleLogs.filter((l) => l.type === "warning");
  if (errors.length) {
    for (const err of errors.slice(0, 5)) {
      add("console", "error", `Console error`, err.text);
    }
  } else {
    add("console", "ok", "No console errors");
  }
  if (warnings.length) {
    for (const w of warnings.slice(0, 3)) {
      add("console", "warning", `Console warning`, w.text);
    }
  }

  const bodyOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  if (bodyOverflow) {
    add("layout", "warning", `Horizontal scrollbar detected`, "Document wider than viewport");
  }

  fs.writeFileSync(`${outDir}/${id}-${viewport.name}.json`, JSON.stringify(findings, null, 2));
  return findings;
}

for (const pageDef of pages) {
  for (const vp of viewports) {
    test(`${pageDef.id} @ ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await auditPage(page, pageDef, vp);
      await context.close();
    });
  }
}

test.afterAll(async () => {
  const all = [];
  for (const pageDef of pages) {
    for (const vp of viewports) {
      const file = `${outDir}/${pageDef.id}-${vp.name}.json`;
      if (fs.existsSync(file)) {
        all.push(...JSON.parse(fs.readFileSync(file, "utf8")));
      }
    }
  }
  fs.writeFileSync(`${outDir}/audit-findings.md`, formatFindings(all));
  console.log("\n=== AUDIT COMPLETE ===");
  console.log(`Total findings: ${all.length}`);
  console.log(`Report: ${outDir}/audit-findings.md`);
});
