import Parser from 'rss-parser';
import { getSetting } from '../db/index.js';

const parser = new Parser({ timeout: 10000 });

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function fetchNews() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;

  const cfg = getSetting('news_feed') ?? {
    url: 'https://feeds.apnews.com/rss/apf-topnews',
    maxItems: 8
  };

  let feed;
  try {
    feed = await parser.parseURL(cfg.url);
  } catch {
    if (cfg.fallbackUrl) {
      feed = await parser.parseURL(cfg.fallbackUrl);
    } else {
      throw new Error('News feed unavailable');
    }
  }

  cache = {
    title: feed.title,
    items: (feed.items ?? []).slice(0, cfg.maxItems).map(item => ({
      title: item.title,
      summary: item.contentSnippet ?? item.content ?? '',
      link: item.link,
      pubDate: item.pubDate ?? item.isoDate
    })),
    updatedAt: new Date().toISOString()
  };
  cacheTime = Date.now();
  return cache;
}
