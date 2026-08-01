import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

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
