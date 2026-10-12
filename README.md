# sidharthkshah.com

## Editing the site

**All wording lives in [`content/site.yaml`](content/site.yaml).** Projects, jobs, articles, links and the homepage text are all there, each with `status: live` or `status: offline`. Edit it, push, and the site updates.

- Article text: the file named in each article's `file:` field.
- The 3D protein: `public/protein.json`, built by `scripts/build-protein.py` (see that file).

## Running locally

```bash
npm install
npm run dev
```
