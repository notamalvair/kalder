# Image sources

These are local WebP copies of the four photographs already referenced by the supplied KALDER_SITE_DEMO_v3 archive. Downloaded over HTTPS from images.unsplash.com on 2026-10-15, preserving the original selected widths and quality 80, with `fm=webp`. No new photographs were selected and no image content was edited locally.

| Local file | Original photo | Width |
|---|---|---|
| restaurant.webp | https://images.unsplash.com/photo-1517248135467-4c7edcad34c4 | 1400 |
| dining.webp | https://images.unsplash.com/photo-1559329007-40df8a9345d8 | 1600 |
| cafe.webp | https://images.unsplash.com/photo-1554118811-1e0d58224f24 | 1000 |
| office.webp | https://images.unsplash.com/photo-1497366216548-37526070297c | 1000 |

Provider license reference: https://unsplash.com/license. The image CDN returned HTTP 200; the license page returned HTTP 401 in the cloud environment, so its current text and individual photographer attribution were not independently retrieved in this session. This source record does not confer additional rights or replace the provider's terms.

The application serves these files from its own `/images/` directory. Building, starting and viewing the current source version no longer requires requests to Unsplash. The archived tracked `dist/` remains the original demo; build current sources or use compose.home.yaml for the updated version.
