# Dashboard Hub

Static hub for separated dashboards running across:

- GitHub Pages
- Google Cloud Run
- Render

## Why this repo should stay separate

- Existing dashboards keep their own deployment pipeline.
- The hub only owns navigation, descriptions, and future status metadata.
- Changes here do not risk breaking Cloud Run or Render apps.

## Local structure

- `index.html`: landing page
- `styles.css`: visual design
- `app.js`: dashboard data and rendering
- `.github/workflows/deploy.yml`: GitHub Pages deployment

## Deploy

1. Create a new GitHub repository for this folder.
2. Push to the `main` branch.
3. In GitHub, enable Pages with `GitHub Actions` as the source.
4. The workflow will publish the hub automatically.
