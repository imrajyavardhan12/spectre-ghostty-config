import { readFile } from "node:fs/promises";
import { expect, test, type Route } from "@playwright/test";

test("a user can open the configuration editor", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /craft your ghostty experience/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Open Editor" }).first().click();

  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByRole("heading", { name: "Fonts" })).toBeVisible();
});

test("a user can edit, inspect, share, and reopen a configuration", async ({
  page,
}) => {
  await page.goto("/editor");

  const fontSize = page.locator("#option-font-size").getByRole("spinbutton");
  await fontSize.fill("16");

  await expect(page.getByText("1 modified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /view config/i }).click();
  await expect(page.getByRole("heading", { name: "Generated Config" })).toBeVisible();
  await expect(page.locator("pre")).toContainText("font-size = 16");

  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByRole("button", { name: "Link Copied!" })).toBeVisible();

  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(shareUrl).toContain("/share?c=");

  await page.goto(shareUrl);
  await expect(
    page.getByRole("heading", { name: "Custom Configuration" })
  ).toBeVisible();
  await expect(page.locator("pre")).toContainText("font-size = 16");

  await page.getByRole("button", { name: "Open Editor", exact: true }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(
    page.locator("#option-font-size").getByRole("spinbutton")
  ).toHaveValue("16");
});

test("a user can import and export a Ghostty configuration", async ({ page }) => {
  await page.goto("/editor");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Config" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "config",
    mimeType: "text/plain",
    buffer: Buffer.from("font-size = 18\ncursor-style = bar\n"),
  });

  await expect(page.getByText("2 modified", { exact: true })).toBeVisible();
  await expect(
    page.locator("#option-font-size").getByRole("spinbutton")
  ).toHaveValue("18");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Config" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toBe("config");
  expect(downloadPath).not.toBeNull();
  await expect(readFile(downloadPath!, "utf8")).resolves.toContain(
    "font-size = 18"
  );
  await expect(readFile(downloadPath!, "utf8")).resolves.toContain(
    "cursor-style = bar"
  );
});

test("a user can navigate and inspect configuration on a mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor");

  await page.getByRole("button", { name: "Colors", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Colors" })).toBeVisible();

  await page.getByRole("button", { name: "View Config" }).click();
  await expect(page.getByRole("heading", { name: "Generated Config" })).toBeVisible();
  await expect(page.getByText("No modifications yet")).toBeVisible();
  await page.waitForTimeout(600);

  const hasHorizontalPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalPageOverflow).toBe(false);
});

test("a user can retry the terminal preview after WASM loading fails", async ({
  page,
}) => {
  const wasmUrl = "**/ghostty-vt.wasm";
  const failWasmRequest = (route: Route) => route.abort("failed");
  await page.route(wasmUrl, failWasmRequest);
  await page.goto("/editor");

  await page.getByRole("button", { name: "Open Preview" }).click();
  await expect(page.getByText("Failed to load preview")).toBeVisible();

  await page.unroute(wasmUrl, failWasmRequest);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Failed to load preview")).not.toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Loading Ghostty WASM...")).not.toBeVisible();
});
