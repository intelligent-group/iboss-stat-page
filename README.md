# iBoss Stat Page

This repository contains the browser interface for the iBoss partner workspace. GitHub Pages serves the dashboard from `ops/` at `https://intelligent-group.github.io/iboss-stat-page/`.

Private account data and authorization are handled by the separate application API. No private records, source transcripts, credentials, or server code are bundled in this repository. Each user signs in with their approved email and password. The browser keeps its bearer session only in memory; refreshing the page requires signing in again.

## Build

```sh
npm ci
npm run build
```

Vite builds the client sources in `src/` into `ops/`. The public assets include the official iBoss logo. Password setup links carry a one-use token in the URL fragment, which the application clears immediately and holds only in memory until password setup is submitted.

## Publish

GitHub Pages is configured to serve the root of `gh-pages`. After verifying a build, publish `ops/`:

```sh
git push origin main
git subtree push --prefix ops origin gh-pages
```

Temporary sign-in passwords expire after 24 hours and grant only a one-hour password-change session. The user must choose a private password with at least 14 characters before the dashboard can load.

The API origin is configured in `src/lib/api.ts`. API permissions are enforced on the server. Partner, owner, and administrator views in the browser do not grant access by themselves.
