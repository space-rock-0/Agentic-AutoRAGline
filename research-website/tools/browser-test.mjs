import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({ channel: "msedge", headless: true });
console.log("Browser launched");
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
console.log("Page loaded");
await page
  .getByRole("heading", { name: "Better retrieval. By reasoning." })
  .waitFor();
await page.screenshot({
  path: "test-results/desktop.png",
  fullPage: false,
  animations: "disabled",
});
console.log("Screenshot saved");
await page.getByLabel("Dataset", { exact: true }).selectOption("1");
console.log("Dataset changed");
await page.getByLabel("Evaluation metric").selectOption("0");
await page.getByLabel("Agent trial budget").selectOption("Agentic@10");
await page.getByLabel("Play architecture").click();
await page.getByLabel("Pause architecture").waitFor();
await page.getByLabel("Pause architecture").click();
await page.getByRole("button", { name: "Next component" }).click();
await page.getByLabel("Reset architecture").click();
const composer = page.getByRole("button", { name: "Composer", exact: true });
await composer.focus();
await composer.press("ArrowRight");
await composer.press("Enter");
await page.getByRole("heading", { name: "Composer", exact: true }).waitFor();
const beforeDrag=await composer.getAttribute('transform');
const box=await composer.boundingBox();
if(!box)throw Error('Composer node has no bounds');
await page.mouse.move(box.x+30,box.y+20);
await page.mouse.down();
await page.mouse.move(box.x+65,box.y+35,{steps:5});
await page.mouse.up();
if(await composer.getAttribute('transform')===beforeDrag)throw Error('Node drag did not move');
await page.getByLabel("Required exam accuracy").fill("80");
await page.getByText("No reported point", { exact: true }).waitFor();
await page.getByLabel("Required exam accuracy").fill("71.5");
await page.getByText("$0.000288", { exact: true }).waitFor();
await page
  .getByRole("button", { name: "Open Figure 2: How quickly search improves" })
  .click();
await page.getByRole("dialog").waitFor();
await page.getByLabel("Zoom in figure").click();
await page.getByLabel("Close figure").click();
await page
  .getByText("Inspect every exact mean and standard deviation", { exact: true })
  .click();
await page.getByLabel("Filter Held-out answer quality").fill("Agentic@20");
await page.getByRole("cell", { name: "0.835 ± 0.013", exact: true }).waitFor();
await page.getByLabel("Filter Held-out answer quality").fill("no-such-method");
await page
  .getByText("No matching rows. Try a model or metric name.", { exact: true })
  .waitFor();
await page.getByLabel("Filter Held-out answer quality").fill("");
await page.getByRole("button", { name: "Use dark theme" }).click();
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: "test-results/dark.png", fullPage: false });
for (const width of [375, 768, 1024]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  if (width === 375) {
    await page.getByLabel("Toggle navigation").click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Results", exact: true })
      .click();
    if (!page.url().endsWith("#results"))
      throw Error("Mobile navigation did not reach results");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw Error(`Horizontal overflow at ${width}`);
  await page.screenshot({
    path: `test-results/width-${width}.png`,
    fullPage: false,
  });
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "PASS: desktop, 375/768/1024px, navigation, chart selects, architecture playback, playground, figure modal, theme, reduced-motion and console checks.",
);
fs.writeFileSync(
  "test-results/browser.json",
  JSON.stringify(
    { passed: true, widths: [375, 768, 1024, 1440], errors },
    null,
    2,
  ),
);
await browser.close();
