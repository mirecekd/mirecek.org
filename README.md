# Miroslav Dvořák

Personal website: cloud, AI, open source and life beyond work.

<div align="center">

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/mirecekdg) [!["PayPal.me"](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?business=LJ5ZF7Q9KMTRW&no_recurring=0&currency_code=USD)

</div>

## Website

Plain HTML, CSS and a small optional JavaScript theme selector. No build step, npm dependencies, database, cookies or analytics. Copper is the default design, including without JavaScript. Four unlisted alternatives can be opened with `?design=organic`, `?design=terminal`, `?design=aurora` or `?design=orbit`.

Only `site/` is deployed. Local research, private notes and screenshots are not part of the repository or deployment artifact.

## Edit and preview

- Edit content and base styles in `site/index.html`.
- Edit theme styles in `site/designs.css`.
- Open `site/index.html` directly, or run the temporary server with Node.js 24:

```sh
node scripts/preview-server.mjs
```

The server prints an available port and listens on all network interfaces. It has no authentication; use only where public preview access is intended. It serves an explicit list of website routes, not the repository directory. Stop with Ctrl+C. Set `PORT` to reuse a port if needed.

## Checks

```sh
node --test tests/*.test.mjs
```

Tests cover reviewed public files, links, basic HTML structure, privacy boundaries and preview server routes. They are not a full HTML, accessibility or security audit.

An optional local Chrome check is available:

```sh
node tests/designs.browser.mjs
```

Start the preview server first and pass `PREVIEW_URL` with its local address. The default is `http://127.0.0.1:46765`. Set `CHROME` if Chrome is not at `/usr/bin/google-chrome`. Screenshots go to the ignored `preview/designs/` directory.

## Enable GitHub Pages

Publication requires both settings below:

1. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables → New repository variable**: name `PAGES_ENABLED`, value `true`.
3. Open **Actions → Check and deploy website → Run workflow**, choose `main` and run it.

The initial preview URL is `https://mirecekd.github.io/mirecek.org/`.

Pull requests run checks only. Main-branch pushes and manual main-branch runs deploy after checks pass and only when `PAGES_ENABLED` is `true`. The deployment uses GitHub OIDC and the `github-pages` environment; no personal access token is stored in the repository. Disabling the variable prevents future deployments but does not remove an already published site.

Configure branch protection to require the `check` job and reviews if desired. It is not enabled by the workflow itself.

## Custom domain cutover

Do not change DNS until the Pages preview has been reviewed.

1. Verify ownership of `mirecek.org` in the GitHub account's Pages settings using the TXT record GitHub provides. Keep that record.
2. Set repository **Settings → Pages → Custom domain** to `www.mirecek.org` before changing web DNS.
3. Point the `www` CNAME to `mirecekd.github.io` (no protocol or path).
4. Configure the apex A records using the current [GitHub Pages DNS documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Preserve mail records, unrelated subdomains and nameservers.
5. Wait for DNS and certificate provisioning, then enable **Enforce HTTPS**. Verify both domains and the old `/home` path.
6. For production, remove the homepage `noindex` directive, update its assertion in `tests/site.test.mjs`, and add the canonical URL `https://www.mirecek.org/`. Keep the compatibility page excluded from indexing.

The preview currently retains `noindex, nofollow`. This is an indexing request, not access control. GitHub Pages previews are public.

`site/home/index.html` is a static compatibility page with a browser redirect and fallback link. It is not an HTTP 301 rule. The preview server redirects `/home` to `/home/`; verify GitHub Pages handling during cutover.

Keep the previous hosting and a DNS backup until the new website has been verified. Revert a commit to roll back content. Restore the previous DNS settings to roll back the hosting cutover, allowing for DNS cache expiry.

## Support

<div align="center">

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/mirecekdg) [!["PayPal.me"](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?business=LJ5ZF7Q9KMTRW&no_recurring=0&currency_code=USD)

</div>

## License

MIT. Copyright (c) 2026 Miroslav Dvorak.
