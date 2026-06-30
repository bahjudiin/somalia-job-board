# Somalia Job Board - Scraper Setup Instructions

## 🎯 What is the Scraper?

The scraper automatically collects job listings from Somali job sources:
- **QaranJobs** (qaranjobs.com)
- **SomaliJobs** (somalijobs.com)
- **Shaqo.com** (shaqo.com)
- **ShaqoHel** (shaqohel.com)
- **Joblink.so** (joblink.so)
- **Telegram channels** (@somalijobsinc, @qaran_jobs, @shaqohel)

It runs on a schedule (GitHub Actions cron) and updates `client/public/jobs.json` which the website displays.

---

## 📦 Files Included

```
scrapers/
├── jobs_scraper.py          ← Python version
├── jobs_scraper.js          ← Node.js version (recommended)
└── README.md                ← This file
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd somalia-job-board

# Install scraper dependencies
npm install cheerio axios sqlite3 node-cron

# Or with pnpm
pnpm add cheerio axios sqlite3 node-cron
```

### Step 2: Run Scraper Manually

```bash
# Test the scraper (uses .cjs because package.json has "type": "module")
node scrapers/jobs_scraper.cjs
```

**Expected output:**
```
==================================================
Somalia Job Scraper — starting
==================================================

  → QaranJobs...
  → SomaliJobs...
  → Shaqo.com...
  → ShaqoHel...
  → Joblink.so...
  → Telegram: @somalijobsinc...
  → Telegram: @qaran_jobs...
  → Telegram: @shaqohel...

✓ Written 42 jobs to ...client/public/jobs.json

✓ Done
```

### Step 3: Check Database

```bash
# View jobs in database
sqlite3 jobs.db "SELECT title, company, source FROM jobs LIMIT 5;"
```

### Step 4: View JSON Export

```bash
# Check exported jobs
cat jobs.json | head -50
```

---

## 🔄 Automatic Scheduling

### Option 1: GitHub Actions (FREE — already set up)

A workflow is already created at `.github/workflows/scrape.yml`. It runs every 6 hours automatically.
It scrapes all sites and Telegram channels, commits updated `client/public/jobs.json` to the repo,
which triggers Vercel to auto-deploy.

To enable it, just push this repo to GitHub. The workflow activates automatically.

You can also trigger it manually from the GitHub Actions tab.

### Option 2: Cron Job (Linux/Mac)

Run scraper automatically every 6 hours:

```bash
# Open crontab editor
crontab -e

# Add this line (runs at 12am, 6am, 12pm, 6pm)
0 */6 * * * cd /path/to/somalia-job-board && node scrapers/jobs_scraper.cjs >> /tmp/scraper.log 2>&1

# Save and exit
```

### Option 3: Local Testing

```bash
# Run the scraper manually to test
node scrapers/jobs_scraper.cjs
```

---

## 🔧 Customizing the Scraper

### Add a New Job Source

Edit `scrapers/jobs_scraper.cjs`:

```javascript
// Add new method
async scrapeMySource() {
  console.log('\n📍 Scraping My Source...');
  const jobs = [];

  try {
    const response = await axios.get('https://example.com/jobs', {
      headers: this.headers,
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const jobCards = $('div.job');

    jobCards.each((index, element) => {
      const title = $(element).find('h3').text().trim();
      const company = $(element).find('.company').text().trim();
      const url = $(element).find('a').attr('href');

      jobs.push({
        id: url.split('/').pop(),
        title,
        company,
        location: 'Somalia',
        type: 'NGO',
        description: '',
        url,
        source: 'My Source',
        date_posted: new Date().toISOString(),
        engagement: 0
      });
    });
  } catch (err) {
    console.error(`✗ Error: ${err.message}`);
  }

  return jobs;
}

// Add to runAllScrapers()
async runAllScrapers() {
  const allJobs = [];
  allJobs.push(...await this.scrapeQaranJobs());
  allJobs.push(...await this.scrapeSomaliJobs());
  allJobs.push(...await this.scrapeMySource());  // ← Add this
  // ... rest of code
}
```

### Change Scraping Frequency

In crontab:
```bash
# Every hour
0 * * * *

# Every 3 hours
0 */3 * * *

# Every 12 hours
0 */12 * * *

# Daily at 2 AM
0 2 * * *

# Every Monday at 9 AM
0 9 * * 1
```

### Limit Number of Jobs

Edit `scrapers/jobs_scraper.js`:

```javascript
// Only keep last 100 jobs
const allJobs = [];
allJobs.push(...await this.scrapeQaranJobs());
allJobs.push(...await this.scrapeSomaliJobs());

// Keep only newest 100
const topJobs = allJobs.slice(0, 100);
await this.saveJobs(topJobs);
```

---

## 🗄️ Database Management

### View All Jobs
```bash
sqlite3 jobs.db "SELECT * FROM jobs;"
```

### Count Jobs by Source
```bash
sqlite3 jobs.db "SELECT source, COUNT(*) FROM jobs GROUP BY source;"
```

### Delete Old Jobs (older than 30 days)
```bash
sqlite3 jobs.db "DELETE FROM jobs WHERE date_posted < datetime('now', '-30 days');"
```

### Backup Database
```bash
cp jobs.db jobs.db.backup
```

### Reset Database
```bash
rm jobs.db
node scrapers/jobs_scraper.js
```

---

## 🐛 Troubleshooting

### Scraper Not Running?

**Check if Node.js is installed:**
```bash
node --version
```

**Check if dependencies are installed:**
```bash
npm list cheerio axios sqlite3
```

**Run scraper with debug output:**
```bash
DEBUG=* node scrapers/jobs_scraper.js
```

### Database Locked Error?

```bash
# Kill any processes using the database
lsof | grep jobs.db

# Or reset the database
rm jobs.db
node scrapers/jobs_scraper.js
```

### Scraper Timing Out?

**Increase timeout in scraper:**
```javascript
const response = await axios.get(url, {
  headers: this.headers,
  timeout: 30000  // 30 seconds instead of 10
});
```

### Jobs Not Updating?

1. **Check if scraper is running:**
   ```bash
   ps aux | grep node
   ```

2. **Check logs:**
   ```bash
   tail -f /tmp/scraper.log
   ```

3. **Run manually:**
   ```bash
   node scrapers/jobs_scraper.js
   ```

4. **Check database:**
   ```bash
   sqlite3 jobs.db "SELECT COUNT(*) FROM jobs;"
   ```

---

## 📊 Monitoring

### Check Scraper Health

Create `server/health.ts`:

```typescript
import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();

app.get('/health', (req, res) => {
  const db = new sqlite3.Database('jobs.db');
  
  db.get('SELECT COUNT(*) as count FROM jobs', (err, row) => {
    if (err) {
      res.status(500).json({ status: 'error', error: err.message });
    } else {
      res.json({
        status: 'ok',
        jobs: row.count,
        timestamp: new Date().toISOString()
      });
    }
    db.close();
  });
});

export default app;
```

### Email Alerts on Failure

Add to scraper:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

try {
  // ... scraping code
} catch (error) {
  // Send email alert
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'admin@example.com',
    subject: '❌ Job Scraper Failed',
    text: `Error: ${error.message}\n\nTime: ${new Date().toISOString()}`
  });
}
```

---

## 🚀 Deployment

### Deploy to Railway

```bash
# 1. Create railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
EOF

# 2. Push to GitHub
git add .
git commit -m "Add scraper"
git push

# 3. Connect to Railway
# Go to railway.app and connect your GitHub repo
```

### Deploy to Replit

```bash
# 1. Create .replit file
cat > .replit << EOF
run = "npm start"
EOF

# 2. Upload to Replit
# Go to replit.com and import from GitHub
```

### Deploy to Your Server

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/YOUR_USERNAME/somalia-job-board.git
cd somalia-job-board

# 3. Install dependencies
npm install

# 4. Start with PM2
npm install -g pm2
pm2 start "npm start" --name "job-board"
pm2 startup
pm2 save

# 5. Set up cron job
crontab -e
# Add: 0 */6 * * * cd /path/to/somalia-job-board && node scrapers/jobs_scraper.js
```

---

## 📈 Performance Tips

### 1. Add Caching
```javascript
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedJobs() {
  if (cache.has('jobs') && Date.now() - cache.get('jobs').time < CACHE_TTL) {
    return cache.get('jobs').data;
  }
  return null;
}
```

### 2. Batch Inserts
```javascript
// Insert multiple jobs in one transaction
db.run('BEGIN TRANSACTION');
jobs.forEach(job => {
  db.run('INSERT INTO jobs VALUES (...)');
});
db.run('COMMIT');
```

### 3. Index Database
```bash
sqlite3 jobs.db << EOF
CREATE INDEX idx_source ON jobs(source);
CREATE INDEX idx_date ON jobs(date_posted);
CREATE INDEX idx_url ON jobs(url);
EOF
```

---

## 🎓 Learning Resources

- **Cheerio (Web Scraping):** https://cheerio.js.org
- **Axios (HTTP Client):** https://axios-http.com
- **SQLite:** https://www.sqlite.org/cli.html
- **Node-Cron:** https://github.com/node-cron/node-cron
- **GitHub Actions:** https://docs.github.com/en/actions

---

## ✅ Checklist

- [ ] Install dependencies: `npm install cheerio axios sqlite3 node-cron`
- [ ] Run scraper manually: `node scrapers/jobs_scraper.js`
- [ ] Check database: `sqlite3 jobs.db "SELECT COUNT(*) FROM jobs;"`
- [ ] Set up cron job (or GitHub Actions)
- [ ] Test automatic execution
- [ ] Monitor logs
- [ ] Deploy to hosting platform
- [ ] Share with users

---

## 🎉 You're Ready!

Your scraper is ready to automatically collect jobs from local Somalia sources. Start with:

```bash
npm install
node scrapers/jobs_scraper.js
```

Then set up automatic scheduling and deploy!

---

**Last Updated:** June 30, 2026  
**Status:** Production Ready ✅
