import Database from 'better-sqlite3';
import fs from 'fs';

const dbFile = './data.db';
const first = !fs.existsSync(dbFile);
const db = new Database(dbFile);

if (first) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY,
      name TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS traffic (
      id INTEGER PRIMARY KEY,
      brand_id INTEGER,
      source TEXT CHECK (source IN ('TrendTrack','SimilarWeb')),
      country TEXT NULL,
      visits REAL,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY,
      brand_id INTEGER,
      platform TEXT CHECK (platform IN ('Google','Facebook')),
      media_url TEXT,
      media_type TEXT CHECK (media_type IN ('image','video')),
      spend_low INTEGER NULL,
      spend_high INTEGER NULL,
      first_seen DATETIME,
      last_seen DATETIME,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );
    CREATE INDEX IF NOT EXISTS idx_traffic_brand ON traffic(brand_id);
    CREATE INDEX IF NOT EXISTS idx_traffic_capture ON traffic(captured_at);
    CREATE INDEX IF NOT EXISTS idx_ads_brand ON ads(brand_id);
    CREATE INDEX IF NOT EXISTS idx_ads_capture ON ads(captured_at);
  `);
}

export default db;
