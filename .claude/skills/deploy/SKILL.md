---
name: deploy
description: Deploy a generated website for a specific account ID
disable-model-invocation: true
argument-hint: <accountId>
---

# Deploy Generated Site

Deploy the site for account ID: $ARGUMENTS

## Steps

1. Run the full site generation and deployment:
   ```bash
   pnpm run generate-site -- --accountId $ARGUMENTS
   ```
   Use a 10-minute timeout (600000ms) since builds take time.

2. Check the tail of the output for success/failure.

3. Report back:
   - Account name
   - Deployment URL
   - Whether git connection and deployment verification succeeded
   - Any warnings or errors

## Outside scripts (pixels, analytics, widgets): check them live

8-nov-2026, Grupo Marín (141): the OpenAI pixel for their ChatGPT ads was in
the HTML since 31-oct, but the CSP in `next.config.js` didn't allow it, so the
browser blocked it even after «Aceptar» and OpenAI saw nothing. Its snippet in
the page proves nothing.

- A new outside script needs its script domain in `script-src` and every
  domain it fetches (config, events) in `connect-src` (image beacons:
  `img-src`). Look for the `https://` URLs inside its SDK file.
- After deploying, open the live page as a phone (Puppeteer), accept cookies,
  and check its requests answer 200/202 with no «Content Security Policy»
  error in the console. Intercept the form POST and abort conversion events,
  so no fake lead or fake conversion reaches the client.
- Run `git fetch` first: `generate-site` builds from this local folder, so it
  must equal `origin/main`. Commit and push the change after the live check.
