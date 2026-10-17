# Activate website-to-app links later

The real portal hostname, Android release certificate and Apple Team ID have not been provided. Nothing in this branch claims that production app links are verified. Custom `eduflow://` links and the `/app/*` browser fallback remain usable.

## Information to collect

| Setting | Where to obtain it |
| --- | --- |
| APP_LINK_HOST | Your actual portal HTTPS hostname, without a URL path or port |
| ANDROID_RELEASE_SHA256 | Play Console > App integrity > App signing certificate SHA-256; use the installed build's signing certificate |
| APPLE_TEAM_ID | Your Apple Developer team identifier |
| Android package / iOS bundle | Currently `com.wis.vidyasetu`; update all native registrations if changing it |

Never send a keystore password, private signing key or Apple account password. The certificate fingerprint and Team ID are public identifiers.

## Generate website association documents

Once the real values exist, set these environment variables in PowerShell:

```powershell
$env:APP_LINK_HOST = 'YOUR_REAL_HOSTNAME'
$env:ANDROID_RELEASE_SHA256 = 'YOUR_RELEASE_CERTIFICATE_SHA256'
$env:APPLE_TEAM_ID = 'YOUR_APPLE_TEAM_ID'
node scripts/app-link-associations.mjs
```

The script rejects missing values, placeholder domains and malformed identifiers before writing anything. It produces `public/.well-known/assetlinks.json` and `public/.well-known/apple-app-site-association`. The normal Vite build copies them into the website output. Serve both files with `Content-Type: application/json`, HTTPS, no authentication and no redirects; exclude `/.well-known/*` from SPA HTML fallback. Check the deployed response body, not just HTTP 200.

Set `VITE_APP_LINK_HOST` to the same hostname before building React. Leave it unset until associations are deployed. Set `PUBLIC_WEB_URL=https://YOUR_REAL_HOSTNAME` on Flask for document QR links. Do not change the API URL to the website URL unless they share the same proxy.

## Build the mobile app

Android: set `APP_LINK_HOST` in the build environment and pass `--dart-define=APP_LINK_HOST=YOUR_REAL_HOSTNAME` to the release Flutter build. The environment value configures Android's manifest; the Dart define configures the trusted link parser. Both must match.

iOS: set the Xcode `APP_LINK_HOST` build setting, enable Associated Domains for the bundle, and pass the same Dart define. Build/sign using your Apple team on macOS. See the Flutter repository's `docs/SCHOOL_LINKS.md` for native configuration.

## Verify before release

1. Open both deployed association URLs and confirm their JSON matches the installed app's identifiers.
2. On a signed Android device use `adb shell pm verify-app-links --re-verify com.wis.vidyasetu` and `adb shell pm get-app-links com.wis.vidyasetu`.
3. Open a real `/app/fees`, `/app/child` and `/verify-document/TOKEN` link with the app closed and already running.
4. Check logged-out, wrong-school, unrelated-child and unauthorized-invoice cases. Links must never submit payments automatically.
5. Repeat on a signed iPhone. Android success does not verify iOS.
6. Uninstall the app and verify the website fallback explains how to sign in and continue. Never redirect repeatedly to an unavailable app.

No production files are generated or published until real values are available. Do not merge or deploy this branch merely to supply those values.
