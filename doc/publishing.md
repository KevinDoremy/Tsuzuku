# Publishing to the Chrome Web Store

## 1. Register a Developer Account

- Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- Sign in with a Google account
- Pay the **one-time $5 registration fee**
- Accept the developer agreement

> Use a dedicated email — all review notifications and policy warnings go there.

---

## 2. Prepare the Extension

### Required assets

| Asset | Size | Format |
|-------|------|--------|
| Extension icon | 128×128px | PNG |
| Management page icon | 48×48px | PNG |
| Favicon | 16×16px | PNG |
| Screenshots | At least 1 | PNG or JPEG |

> Icons must be square. SVG is not supported. Leave 16px transparent padding around the icon content (so effective content area is 96×96).

### Package

Zip the extension folder with `manifest.json` at the root:

```bash
zip -r tsuzuku.zip . --exclude "*.git*" --exclude "doc/*" --exclude "node_modules/*"
```

---

## 3. Submit

1. In the dashboard, click **Add new item**
2. Upload the ZIP
3. Fill in the store listing:
   - Name (max 75 chars)
   - Description (max 132 chars for short description)
   - Category
   - Screenshots
4. Choose distribution: **Public**, **Unlisted**, or **Private**
5. Click **Submit for Review**

---

## 4. Review Process

| Stage | Timeline |
|-------|----------|
| Typical review | Under 24 hours |
| 90% of reviews | Under 3 days |
| Max wait | 3 weeks (contact support if exceeded) |
| Publishing window after approval | 30 days (reverts to draft otherwise) |

### Common rejection reasons

- Permissions not clearly justified
- Description doesn't match actual functionality
- Policy violations
- Remote code execution (not allowed in MV3)

---

## 5. Updates

- Bump the `version` field in `manifest.json` for every release
- Re-zip and upload the new package
- Updates go through the same review process

---

## 6. Manifest V3 Checklist

- [ ] `"manifest_version": 3` in `manifest.json`
- [ ] Background uses a **service worker**, not a background page
- [ ] No remotely hosted code
- [ ] Use `declarativeNetRequest` for any request blocking/modification
- [ ] Strict Content Security Policy

---

## Links

- [Publish guide](https://developer.chrome.com/docs/webstore/publish)
- [Review process](https://developer.chrome.com/docs/webstore/review-process)
- [Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Icon requirements](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons)
