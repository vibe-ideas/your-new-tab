# your-new-tab — Marketing Site

Astro 5 static site deployed to GitHub Pages at <https://vibe-ideas.github.io/your-new-tab/>.

## Develop

```bash
cd site
pnpm install
pnpm dev            # http://localhost:4321/
```

> Following the repo convention, no lockfile is committed (the root `.gitignore` ignores `package-lock.json` and the user's pnpm config is `package-lock=false`).

`predev` / `prebuild` automatically copy `demo.gif`, the icon, and screenshots from the repo root into `public/` so the site stays free of duplicated binaries in git.

## Build & preview

```bash
pnpm build          # output -> site/dist
pnpm preview        # http://localhost:4321/your-new-tab/
```

The `base: '/your-new-tab/'` setting in `astro.config.mjs` means the preview server serves under that subpath — matching the live GitHub Pages URL. Visiting `http://localhost:4321/` should 404 (proves the base config works).

## Deploy

`.github/workflows/pages.yml` builds and deploys automatically on push to `main` whenever `site/**` (or a referenced asset) changes.

## Translation

`src/i18n/zh.ts` is the source of truth. `src/i18n/en.ts` mirrors its shape (TS will complain if a key is missing).
