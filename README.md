# Yoto Animated Icon Assigner

Local-only web app for assigning 16×16 animated GIFs as icons to individual tracks on your Yoto MYO cards. No backend, no audio upload — just pick a card, drop a GIF onto a track, save. Re-tap the card on the Yoto Mini and the track plays with its new animated icon on the pixel display.

## 1. Register a Yoto application

Go to https://dashboard.yoto.dev/applications/new and fill the form like this:

| Field | Value |
|---|---|
| Name | `Custom Animated Gif Icons` |
| Description | `Personal tool for assigning 16x16 animated GIF icons to tracks on my MYO Yoto cards.` |
| Application Type | **Public Client** |
| Allowed Callback URLs | `http://localhost:5173/` *(add your GitHub Pages URL here later too — see Deploy section)* |
| Allowed Logout URLs | `http://localhost:5173` |
| Scopes | check **`user:content:view`**, **`user:content:manage`**, **`user:icons:manage`** |
| Application Logo | leave blank |
| Privacy Policy URL | leave blank (or any placeholder you control) |
| Terms and Conditions | ✓ |
| Data Privacy | ✓ |

Click **Create Application**. The dashboard returns a `client_id`. There is no client secret — Public Client + PKCE doesn't need one.

## 2. Configure

```bash
cp .env.example .env.local
```

Open `.env.local` and paste the client id:

```
VITE_YOTO_CLIENT_ID=<the-client-id-from-the-dashboard>
```

## 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. Click **Sign in with Yoto**, approve access, and you'll land on your card grid.

## 4. Use

1. Click a card. You'll see its tracks listed with their current icons.
2. Drop a 16×16 `.gif` onto a track's icon cell (or click **Choose GIF**).
3. Repeat for as many tracks as you want.
4. Click **Save changes**.
5. Re-tap the physical MYO card on your Yoto Mini — each track now shows its new animated icon while playing.

### Bulk-assign

Drop a folder of GIFs named `01.gif`, `02.gif`, … onto the bottom drop zone. The app pairs each GIF with the matching track number, then a single Save commits them all.

## Requirements

- GIFs must be **exactly 16×16 pixels**. The app rejects mis-sized files before upload (Yoto silently rejects them, which makes debugging painful).
- The app expects animation — it uploads with `autoConvert=false` so frames are preserved.

## Stack

- Vite + React + TypeScript SPA, no backend.
- OAuth2 Authorization Code + PKCE against `https://login.yotoplay.com`.
- Direct calls to `https://api.yotoplay.com` from the browser.
- Refresh token stored in `localStorage` (fine for a local dev tool).

## Files of interest

- `src/auth/oauth.ts` — PKCE flow, token refresh.
- `src/api/icons.ts` — animated icon upload (raw `image/gif` body, `autoConvert=false`).
- `src/api/content.ts` — MYO content read + write.
- `src/lib/mutate.ts` — immutable card mutation for setting `display.icon16x16`.
- `src/components/CardDetailScreen.tsx` — main editor screen.

## Deploy to GitHub Pages (use it from your iPad)

1. **Create a GitHub repo** for this project and push it.
2. **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables tab → New repository variable:**
   - Name: `YOTO_CLIENT_ID`
   - Value: your Yoto client id
   (It's a Variable, not a Secret — the client id is public for PKCE apps and needs to be inlined into the built JS.)
4. **Push to `main`.** The `.github/workflows/deploy.yml` workflow builds and publishes `dist/` automatically. The first run also enables Pages.
5. **Get the Pages URL** — it's `https://<your-user>.github.io/<repo>/`. Watch the Actions tab for the exact URL on first deploy.
6. **Register that URL on Yoto.** In https://dashboard.yoto.dev/applications open your app and add to **Allowed Callback URLs** (comma-separated alongside the localhost entry):
   ```
   https://<your-user>.github.io/<repo>/
   ```
   Note the **trailing slash** — it must match exactly. Save.
7. Open the Pages URL on your iPad, sign in, use it the same way as locally.

Notes:
- The redirect URI is the app root with a `?code=…` query (not `/callback`), because GitHub Pages doesn't SPA-route deep paths without a workaround.
- The `VITE_BASE_PATH` env var in the workflow is set to `/<repo-name>/` from `github.event.repository.name`, so the build works regardless of what you name the repo.
- Refresh tokens are disabled (Yoto didn't approve `offline_access` for this app), so an access token lasts a few hours. When it expires on your iPad, just sign in again.

## Known gaps

- The list-MYO-content read endpoint isn't explicitly documented; `src/api/content.ts` probes a few likely paths. If listing fails, check the network tab and update the candidate list with whatever Yoto's API reference says.
- No production deployment. The app is local-only.
