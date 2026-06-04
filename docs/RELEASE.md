# Release Checklist

Spectre uses GitHub Releases and git tags. The app is private in `package.json`; releases are product snapshots, not npm publishes.

## Versioning

- Patch (`v0.2.1`): fixes only.
- Minor (`v0.3.0`): user-visible features, reliability work, or Ghostty compatibility updates.
- Major (`v1.0.0`): stable public contract for config generation, import/export, share links, and Ghostty compatibility.

Track Ghostty compatibility separately from the Spectre app version.

## Before tagging

1. Confirm schema/config changes against the source-of-truth order:
   - Ghostty Config Reference: https://ghostty.org/docs/config/reference
   - Ghostty Official Docs: https://ghostty.org/docs
   - Ghostty source: https://github.com/ghostty-org/ghostty
2. Run the full verification suite:

   ```bash
   bun run typecheck
   bun run lint
   bun run test -- --run
   bun run build
   ```

3. Update `CHANGELOG.md`.
4. Bump `package.json` version and `src/lib/version.ts` together.
5. Run the version sync test (`src/lib/version.test.ts`) as part of the full test suite.
6. Commit the release change:

   ```bash
   git add package.json src/lib/version.ts CHANGELOG.md
   git commit -m "chore: release vX.Y.Z"
   ```

7. Tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```

8. Draft a GitHub Release using the changelog notes.
