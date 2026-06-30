# Somalia Job Board - FREE Automated Scraper Setup Guide

## 🎯 Overview

This guide shows you how to set up **completely FREE** automated job scraping for local Somalia job sources (QaranJobs, SomaliJobs, social media) with **zero cost**.

**What you'll get:**
- ✅ Automatic job scraping every 6-12 hours
- ✅ Free database storage (SQLite or PostgreSQL)
- ✅ Free hosting (Heroku, Railway, Replit, or your own server)
- ✅ Updated job listings in real-time
- ✅ No credit card required

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your React Frontend                       │
│              (Somalia Job Board Website)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ (fetch /api/jobs)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│              (Node.js + Express)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │QaranJobs│ │SomaliJobs│ │Social  │
    │(Scrape) │ │(Scrape)  │ │Media   │
    └────────┘  └────────┘  └────────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
        ┌────────────────────────┐
        │   SQLite Database      │
        │  (jobs.db file)        │
        └────────────────────────┘
        
    Scheduler (Cron Job)
    Runs every 6-12 hours
    Updates database automatically
```

---

## 🚀 Option 1: FREE Hosting on Railway (Recommended)

Railway offers **$5/month free credit** which is more than enough for this project.

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free)
3. Create new project

### Step 2: Connect Your Repository
```bash
# In your project directory
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/somalia-job-board.git
git push -u origin main
```

### Step 3: Deploy on Railway
1. Click "New Project" on Railway
2. Select "GitHub Repo"
3. Choose your repository
4. Railway auto-detects Node.js
5. Deploy automatically

### Step 4: Set Up Cron Job
Create `server/cron.ts`:
```typescript
import cron from 'node-cron';
import JobsScraper from '../scrapers/jobs_scraper';

// Run scraper every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled job scraper...');
  const scraper = new JobsScraper();
  await scraper.runAllScrapers();
});

export default cron;
```

### Cost
- **FREE** ($5/month credit covers everything)
- No credit card required for first 30 days

---

## 🚀 Option 2: FREE Hosting on Heroku (Legacy)

Heroku discontinued free tier, but you can use their free tier alternative.

### Alternative: Use Replit (100% FREE)

1. Go to https://replit.com
2. Create new Node.js project
3. Upload your code
4. Click "Run"
5. Your app runs 24/7 for free

**Cost:** Completely FREE

---

## 🚀 Option 3: FREE Hosting on Your Own Server

If you have a Linux server (VPS, Raspberry Pi, old laptop):

### Step 1: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 3: Clone Your Project
```bash
git clone https://github.com/YOUR_USERNAME/somalia-job-board.git
cd somalia-job-board
npm install
```

### Step 4: Start with PM2
```bash
pm2 start "npm start" --name "job-board"
pm2 startup
pm2 save
```

### Step 5: Set Up Cron Job
```bash
# Edit crontab
crontab -e

# Add this line to run scraper every 6 hours
0 */6 * * * cd /path/to/somalia-job-board && node scrapers/jobs_scraper.js
```

**Cost:** FREE (only your electricity/internet)

---

## 📦 Installation Steps

### 1. Install Dependencies

```bash
# Frontend dependencies (already installed)
cd client
npm install

# Backend dependencies
cd ../server
npm install cheerio axios sqlite3 node-cron express cors

# Or use pnpm
pnpm add cheerio axios sqlite3 node-cron express cors
```

### 2. Create Backend API

Create `server/api.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, '..', 'jobs.db');

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all('SELECT * FROM jobs ORDER BY date_posted DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
    db.close();
  });
});

// Get jobs by source
app.get('/api/jobs/source/:source', (req, res) => {
  const { source } = req.params;
  const db = new sqlite3.Database(DB_PATH);
  
  db.all('SELECT * FROM jobs WHERE source = ? ORDER BY date_posted DESC', [source], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
    db.close();
  });
});

// Search jobs
app.get('/api/jobs/search/:query', (req, res) => {
  const { query } = req.params;
  const db = new sqlite3.Database(DB_PATH);
  
  const searchTerm = `%${query}%`;
  db.all(
    'SELECT * FROM jobs WHERE title LIKE ? OR company LIKE ? OR description LIKE ? ORDER BY date_posted DESC',
    [searchTerm, searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    }
  );
});

// Get job statistics
app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(`
    SELECT 
      COUNT(*) as total,
      source,
      job_type
    FROM jobs
    GROUP BY source, job_type
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
    db.close();
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### 3. Update Frontend to Fetch Live Data

Edit `client/src/pages/Home.tsx`:
```typescript
import { useEffect, useState } from 'react';

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch jobs from backend API
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching jobs:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      {/* Your existing UI */}
      {jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.company}</p>
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

---

## ⏰ Automatic Scheduling (FREE Options)

### Option 1: Cron Job (Best)
Run scraper automatically every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line
0 */6 * * * cd /path/to/somalia-job-board && node scrapers/jobs_scraper.js >> /tmp/scraper.log 2>&1
```

### Option 2: GitHub Actions (Completely FREE)

Create `.github/workflows/scrape.yml`:
```yaml
name: Scrape Jobs

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: node scrapers/jobs_scraper.js
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'Auto-update jobs'
```

### Option 3: IFTTT (Completely FREE)

1. Go to https://ifttt.com
2. Create applet: "If date/time, then webhook"
3. Set webhook to trigger your scraper API endpoint
4. Runs automatically on schedule

**Cost:** FREE

---

## 🗄️ Database Options (All FREE)

### Option 1: SQLite (Recommended for small projects)
- **Cost:** FREE
- **Setup:** Already included
- **File:** `jobs.db`
- **Pros:** No setup, works offline
- **Cons:** Limited to single server

### Option 2: PostgreSQL Free Tier
- **Cost:** FREE ($15/month credit on Railway)
- **Setup:** 5 minutes
- **Pros:** Scalable, multi-server
- **Cons:** Requires setup

### Option 3: MongoDB Atlas Free Tier
- **Cost:** FREE (512MB storage)
- **Setup:** 10 minutes
- **Pros:** NoSQL, flexible schema
- **Cons:** Limited storage

---

## 📊 Monitoring (FREE Tools)

### Option 1: Uptime Robot
- **Cost:** FREE
- **Setup:** https://uptimerobot.com
- **Features:** Monitor if scraper is running
- **Alerts:** Email if scraper fails

### Option 2: GitHub Actions Logs
- **Cost:** FREE
- **Setup:** Built-in
- **Features:** View scraper logs on GitHub

### Option 3: Simple Email Alerts
Add to your scraper:
```javascript
// Send email on error
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// On error:
transporter.sendMail({
  from: process.env.EMAIL,
  to: 'your-email@gmail.com',
  subject: 'Job Scraper Failed',
  text: error.message
});
```

**Cost:** FREE (Gmail SMTP)

---

## 🔧 Troubleshooting

### Scraper Not Running?
```bash
# Check logs
tail -f /tmp/scraper.log

# Run manually
node scrapers/jobs_scraper.js

# Check database
sqlite3 jobs.db "SELECT COUNT(*) FROM jobs;"
```

### Database Locked?
```bash
# Reset database
rm jobs.db
node scrapers/jobs_scraper.js
```

### Website Not Updating?
1. Check if backend API is running
2. Check browser console for errors
3. Verify database has jobs: `sqlite3 jobs.db "SELECT * FROM jobs LIMIT 1;"`

---

## 📈 Performance Tips

### 1. Cache Results
```typescript
// Cache jobs for 1 hour
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

app.get('/api/jobs', (req, res) => {
  if (cache.has('jobs') && Date.now() - cache.get('jobs').time < CACHE_TTL) {
    return res.json(cache.get('jobs').data);
  }
  // ... fetch from database
});
```

### 2. Limit Results
```typescript
// Only fetch last 100 jobs
db.all('SELECT * FROM jobs ORDER BY date_posted DESC LIMIT 100', ...);
```

### 3. Index Database
```sql
CREATE INDEX idx_source ON jobs(source);
CREATE INDEX idx_date ON jobs(date_posted);
```

---

## 🎯 Complete Free Stack

| Component | Tool | Cost |
|-----------|------|------|
| Frontend | React + Tailwind | FREE |
| Backend | Node.js + Express | FREE |
| Database | SQLite | FREE |
| Scraper | Cheerio + Axios | FREE |
| Scheduling | Cron / GitHub Actions | FREE |
| Hosting | Railway / Replit / VPS | FREE |
| Monitoring | Uptime Robot | FREE |
| **TOTAL** | | **$0/month** |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install cheerio axios sqlite3 node-cron express cors

# 2. Run scraper manually
node scrapers/jobs_scraper.js

# 3. Check database
sqlite3 jobs.db "SELECT COUNT(*) FROM jobs;"

# 4. Start backend
npm start

# 5. Visit http://localhost:3000
```

---

## 📱 Next Steps

1. **Set up hosting** (Railway or Replit)
2. **Configure scraper** (edit sources as needed)
3. **Set up scheduling** (Cron or GitHub Actions)
4. **Monitor** (Uptime Robot)
5. **Share** with your audience

---

## 🎓 Learning Resources

- **Web Scraping:** https://cheerio.js.org
- **Node.js:** https://nodejs.org
- **SQLite:** https://www.sqlite.org
- **Express:** https://expressjs.com
- **Railway:** https://railway.app/docs
- **GitHub Actions:** https://docs.github.com/en/actions

---

## 💡 Tips for Success

1. **Start small** - Scrape 2-3 sources first
2. **Test locally** - Run scraper on your computer first
3. **Monitor logs** - Check if scraper is running
4. **Handle errors** - Add try-catch blocks
5. **Rate limit** - Add delays between requests
6. **Update regularly** - Run scraper every 6-12 hours

---

## ⚠️ Important Notes

1. **Respect robots.txt** - Check before scraping
2. **Add delays** - Don't hammer servers (2-5 second delays)
3. **User-Agent** - Identify your bot
4. **Terms of Service** - Check if scraping is allowed
5. **Data Privacy** - Don't store personal data

---

## 🎉 You're Ready!

Everything is completely FREE. Start with:

```bash
npm install
node scrapers/jobs_scraper.js
npm start
```

Then deploy to Railway or Replit for automatic updates!

---

**Last Updated:** June 30, 2026  
**Status:** Production Ready ✅  
**Cost:** $0/month 🎉
