# iBoss Stat Page

The public website source lives in `ops/`. It contains only the sign-in entry page, the official iBoss logo, and `.nojekyll`.

GitHub Pages publishes the contents of `ops/` through the `gh-pages` branch. The live entry page is https://intelligent-group.github.io/iboss-stat-page/.

The Sign in link opens the secured iBoss Partner Desk on its existing backend. Account data, authentication, access management, and recurring CRM updates remain on that backend. No private records, credentials, or backend source are stored here.

After changing files in `ops/`, publish the updated subtree with:

```sh
git push origin main
git subtree push --prefix ops origin gh-pages
```

GitHub Pages is configured to deploy from the root of `gh-pages`. No custom workflow or secrets are required.
