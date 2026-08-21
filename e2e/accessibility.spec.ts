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

test("the mobile theme browser supports keyboard navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await mockThemeService(page);
  await page.goto("/themes");
  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Search themes" });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "All", exact: true })).toBeFocused();

  const hasHorizontalPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalPageOverflow).toBe(false);
});
