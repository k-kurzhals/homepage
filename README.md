# Kuno Kurzhals — Academic Profile

Static academic profile page with a tile gallery of all publications.
No build step, no dependencies — just HTML + CSS + vanilla JS.

## Structure

```
index.html            — the page
css/style.css         — styling (light theme, responsive)
js/main.js            — loads data, renders tiles, filters + search
data/publications.json — all publications (edit this to update content)
```

## Update publications

Edit `data/publications.json`. Each entry:

```json
{
  "id": 70,
  "year": 2026,
  "cat": "journal",            // journal | conf | chapter | thesis
  "title": "…",
  "authors": ["First, Last", "…", "Kurzhals, Kuno"],
  "venue": "Journal/Conference name vol.issue",
  "pages": "1–12",
  "doi": "10.1234/abcd",       // optional; links the card to doi.org
  "url": "https://…"           // optional fallback if no DOI
}
```

Cards are sorted by year (newest first) automatically.

## Run locally

Any static server works (fetch() doesn't work over `file://`):

```
npx serve .
# or
python3 -m http.server 8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Settings → Pages → deploy from branch (e.g. `main`, root `/`).
3. Done — no configuration needed.
