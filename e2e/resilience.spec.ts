import { expect, test, type Route } from "@playwright/test";

const themeListUrl =
  "https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/ghostty";

test("a user can retry after the remote theme service fails", async ({ page }) => {
  const failThemeList = (route: Route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Service unavailable" }),
    });
  await page.route(themeListUrl, failThemeList);

  await page.goto("/themes");
  await expect(page.getByText("Failed to load themes")).toBeVisible();

  await page.unroute(themeListUrl, failThemeList);
  await page.route(themeListUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          type: "file",
          name: "Dracula",
          download_url:
            "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/Dracula",
        },
      ]),
    })
  );
  await page.route(
    "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty/Dracula",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: [
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
        ].join("\n"),
      })
  );

  await page.getByRole("button", { name: "Try Again" }).click();

  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();
  await expect(page.getByText("1 of 1 themes loaded")).toBeVisible();
});
