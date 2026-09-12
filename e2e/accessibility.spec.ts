import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const THEME_LIST_URL =
  "https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/ghostty";
const DRACULA_THEME_URL =
  "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/Dracula";
const DRACULA_THEME_CONTENT = [
  "background = #282a36",
  "foreground = #f8f8f2",
  "cursor-color = #f8f8f2",
  "palette = 0=#21222c",
  "palette = 1=#ff5555",
  "palette = 2=#50fa7b",
  "palette = 3=#f1fa8c",
  "palette = 4=#bd93f9",
  "palette = 5=#ff79c6",
  "palette = 6=#8be9fd",
  "palette = 7=#f8f8f2",
].join("\n");

async function mockThemeService(page: Page) {
  await page.route(THEME_LIST_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          type: "file",
          name: "Dracula",
          download_url: DRACULA_THEME_URL,
        },
      ]),
    })
  );
  await page.route(DRACULA_THEME_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: DRACULA_THEME_CONTENT,
    })
  );
}

async function findAccessibilityViolations(page: Page) {
  // Let entrance animations settle so axe measures final colors and opacity.
  await page.waitForTimeout(1_000);

  const results = await new AxeBuilder({ page })
    .withTags(WCAG_AA_TAGS)
    .analyze();

  return results.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map((node) => node.target),
  }));
}

test("the editor has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Fonts" })).toBeVisible();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the landing page has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /craft your ghostty experience/i })
  ).toBeVisible();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the mobile editor has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Fonts" })).toBeVisible();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the theme browser has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await mockThemeService(page);

  await page.goto("/themes");
  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

async function openImportReview(page: Page, buffer: Buffer) {
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Fonts" })).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Config" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "config",
    mimeType: "text/plain",
    buffer,
  });
  await expect(
    page.getByRole("heading", { name: "Review imported configuration" })
  ).toBeVisible();
}

test("the valid-only import review has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await openImportReview(
    page,
    Buffer.from("font-size = 18\ncursor-style = bar\n")
  );

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the import review with warnings has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await openImportReview(
    page,
    Buffer.from("font-size = 14\nfont-size = 16\nfuture-option = abc\n")
  );

  await expect(page.getByText("Unverified", { exact: true })).toBeVisible();
  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the import review with errors has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  await openImportReview(
    page,
    Buffer.from(
      "font-size = 16\nmouse-hide-while-typing = maybe\nnot an instruction\n"
    )
  );

  await expect(
    page.getByRole("button", {
      name: "Replace with 1 setting and skip 2 lines",
    })
  ).toBeVisible();
  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the mobile import review remains usable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openImportReview(
    page,
    Buffer.from(
      [
        "font-family = First Family With A Long Name",
        "font-family = Second Family With A Long Name",
        "keybind = ctrl+shift+c=copy_to_clipboard",
        "palette = 0=#ffffff",
        `future-option = ${"x".repeat(200)}`,
        "mouse-hide-while-typing = maybe",
      ].join("\n") + "\n"
    )
  );

  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  const focusStaysInDialog = await page.evaluate(() =>
    Boolean(document.activeElement?.closest('[data-slot="dialog-content"]'))
  );
  expect(focusStaysInDialog).toBe(true);

  const hasHorizontalPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalPageOverflow).toBe(false);
  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("editor field errors meet WCAG contrast", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Colors", exact: true }).click();
  await page.locator("#option-background input").fill("notacolor");
  await expect(
    page.locator("#option-background").getByRole("alert")
  ).toContainText("Use #RGB");

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("keybind row errors meet WCAG contrast", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "spectre-config",
      JSON.stringify({
        state: {
          config: {
            keybind: ["ctrl+ctrl+c=new_tab", "ctrl+k=close_all_windows"],
          },
          appliedTheme: null,
        },
        version: 0,
      })
    );
  });
  await page.goto("/editor");
  await page.getByRole("button", { name: /Keybinds/ }).click();
  await expect(
    page.locator("#option-keybind").getByText("ctrl+ctrl+c")
  ).toBeVisible();

  const rowErrorIcon = page.locator('#option-keybind svg.text-destructive').first();
  await expect(rowErrorIcon).toBeVisible();
  await rowErrorIcon.hover();
  await expect(page.getByText("Duplicate modifier").first()).toBeAttached();

  expect(await findAccessibilityViolations(page)).toEqual([]);

  const rowWarningIcon = page.locator('#option-keybind svg.text-amber-500').first();
  await expect(rowWarningIcon).toBeVisible();
  await rowWarningIcon.hover();
  await expect(page.getByText(/is deprecated/).first()).toBeAttached();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("theme download errors meet WCAG contrast", async ({ page }) => {
  const draculaUrl =
    "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/Dracula";
  await page.route(THEME_LIST_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ type: "file", name: "Dracula", download_url: draculaUrl }]),
    })
  );
  await page.route(draculaUrl, (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "error" })
  );

  await page.goto("/themes");
  await expect(page.getByText("1 theme failed to load.")).toBeVisible();

  expect(await findAccessibilityViolations(page)).toEqual([]);
});

test("the mobile theme browser supports keyboard navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await mockThemeService(page);
  await page.goto("/themes");
  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Spectre home" })
  ).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search themes" });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "All", exact: true })).toBeFocused();

  const hasHorizontalPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalPageOverflow).toBe(false);
  expect(await findAccessibilityViolations(page)).toEqual([]);
});
