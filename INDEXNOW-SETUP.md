#LetsStudy Pro — IndexNow Setup

## 1. Key file

The IndexNow key file must remain in the website root:

`/a75ed703511a493da02d2bfeb893824f.txt`

Its content must be exactly:

`a75ed703511a493da02d2bfeb893824f`

After Firebase deployment, verify:

https://letsstudy.pro/a75ed703511a493da02d2bfeb893824f.txt

## 2. Submit selected URLs locally

Requires Node.js 20+:

```bash
node scripts/indexnow-submit.js --urls "https://letsstudy.pro/,https://letsstudy.pro/courses.html"
```

## 3. Submit a list of URLs

Create `changed-urls.txt` with one URL per line:

```text
https://letsstudy.pro/
https://letsstudy.pro/courses.html
https://letsstudy.pro/scholarships.html
```

Then:

```bash
node scripts/indexnow-submit.js --file changed-urls.txt
```

## 4. Submit sitemap URLs

```bash
node scripts/indexnow-submit.js --sitemap "https://letsstudy.pro/sitemap.xml"
```

Use your actual sitemap URL if the production sitemap has a different filename.

## 5. GitHub Actions

The included workflow runs automatically after pushes to `main` when HTML/XML/TXT files change.

It submits changed HTML pages.

You can also open:

GitHub → Actions → LetsStudy Pro - IndexNow → Run workflow

Then choose:

- `changed` — submit changed HTML pages
- `sitemap` — submit URLs discovered from the sitemap

## Important

IndexNow is a notification system. A successful HTTP 200 response means the URL submission was accepted; it does not guarantee immediate indexing or ranking.

Do not put the IndexNow key in a secret unless you want to manage it that way. The key file itself is intentionally public so search engines can verify ownership.