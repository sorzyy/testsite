import { chromium } from 'playwright';
import db from './db.js';

const trendTrackExt = process.cwd() + '/extensions/trendtrack';
const similarWebExt = process.cwd() + '/extensions/similarweb';
const profilePath = process.cwd() + '/profile';

export async function launchBrowser() {
  return await chromium.launchPersistentContext(profilePath, {
    headless: true,
    args: [
      `--disable-extensions-except=${trendTrackExt},${similarWebExt}`,
      `--load-extension=${trendTrackExt},${similarWebExt}`
    ]
  });
}

export async function scrapeTrendTrack(page, brand) {
  await page.goto(brand.url);
  await page.waitForTimeout(5000);
  await page.click('div#trendtrack-widget-toggle');
  const text = await page.textContent('span.visits');
  const visits = parseFloat(text.replace(/[^0-9.]/g, ''));
  const stmt = db.prepare('INSERT INTO traffic (brand_id, source, country, visits, captured_at) VALUES (?,?,?,?,datetime(\'now\'))');
  stmt.run(brand.id, 'TrendTrack', null, visits);
}

export async function scrapeSimilarWeb(page, brand) {
  await page.goto(brand.url);
  await page.waitForTimeout(5000);
  const globalText = await page.textContent('span.sw-total-visits');
  const globalVisits = parseFloat(globalText.replace(/[^0-9.]/g, ''));
  let stmt = db.prepare('INSERT INTO traffic (brand_id, source, country, visits, captured_at) VALUES (?,?,?,?,datetime(\'now\'))');
  stmt.run(brand.id, 'SimilarWeb', null, globalVisits);

  const rows = await page.$$('div.sw-country-row');
  for (const row of rows) {
    const country = (await row.$eval('span.country', el => el.textContent)).trim();
    const pctText = await row.$eval('span.percent', el => el.textContent);
    const pct = parseFloat(pctText.replace(/[^0-9.]/g, ''));
    const visits = (globalVisits * pct) / 100;
    stmt.run(brand.id, 'SimilarWeb', country, visits);
  }
}

export async function scrapeGoogleAds(page, brand) {
  const url = `https://adstransparency.google.com/advertiser/${encodeURIComponent(brand.name)}`;
  await page.goto(url);
  let processed = 0;
  while (processed < 100) {
    const tiles = await page.$$('div.AdTile');
    for (const tile of tiles.slice(processed)) {
      const media = await tile.$('img, video');
      const media_url = await media.getAttribute('src');
      const media_type = (await media.evaluate(el => el.tagName)).toLowerCase();
      const impText = await tile.textContent();
      const m = impText.match(/Impressions[^0-9]*(\d+[KM]?)\D*(\d+[KM]?)/);
      let spend_low = null, spend_high = null;
      if (m) {
        spend_low = parseRange(m[1]);
        spend_high = parseRange(m[2]);
      }
      const first_seen = await tile.getAttribute('data-first-seen');
      const last_seen = await tile.getAttribute('data-last-seen');
      upsertAd(brand.id, 'Google', media_url, media_type, spend_low, spend_high, first_seen, last_seen);
    }
    processed = tiles.length;
    const before = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => window.scrollY);
    if (after === before) break;
  }
}

export async function scrapeFacebookAds(page, brand) {
  const token = process.env.FB_ACCESS_TOKEN;
  if (!token) return;
  let url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${token}&search_terms=${encodeURIComponent(brand.name)}`;
  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.data) break;
    for (const ad of json.data) {
      const media_url = ad.ad_snapshot_url;
      const media_type = media_url.endsWith('.mp4') ? 'video' : 'image';
      upsertAd(brand.id, 'Facebook', media_url, media_type, null, null, ad.ad_creation_time, ad.ad_creation_time);
    }
    url = json.paging && json.paging.next;
  }
}

function upsertAd(brand_id, platform, media_url, media_type, spend_low, spend_high, first_seen, last_seen) {
  const stmt = db.prepare(`INSERT INTO ads (brand_id, platform, media_url, media_type, spend_low, spend_high, first_seen, last_seen, captured_at)
    VALUES (?,?,?,?,?,?,?,?,datetime('now'))`);
  stmt.run(brand_id, platform, media_url, media_type, spend_low, spend_high, first_seen, last_seen);
}

function parseRange(text) {
  if (!text) return null;
  const multipliers = { K: 1000, M: 1000000 };
  const m = text.match(/(\d+)([KM]?)/);
  if (!m) return parseInt(text, 10);
  return parseInt(m[1], 10) * (multipliers[m[2]] || 1);
}

export async function runAllScrapers() {
  const context = await launchBrowser();
  const page = await context.newPage();
  const brands = db.prepare('SELECT * FROM brands').all();
  for (const brand of brands) {
    try {
      await scrapeTrendTrack(page, brand);
      await scrapeSimilarWeb(page, brand);
      await scrapeGoogleAds(page, brand);
      await scrapeFacebookAds(page, brand);
    } catch (err) {
      console.error('Scraper error for', brand.name, err);
    }
  }
  await page.close();
  await context.close();
}
