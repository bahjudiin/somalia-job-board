# Somalia Job Board - API Documentation & Data Sources

## 📚 Complete API Reference for All Job Sources

---

## 1. QaranJobs API

**Website:** https://qaranjobs.com  
**Type:** Local Somalia Job Board  
**Authentication:** None required for public listings

### Endpoint Structure
```
GET https://qaranjobs.com/category/jobs-in-somalia/
GET https://qaranjobs.com/?s={search_query}
```

### Data Extraction Method
- **Method:** Web scraping (no official API)
- **Tools:** Cheerio, Puppeteer, or Selenium
- **Rate Limit:** Respect robots.txt; implement delays between requests

### Example Job Data from QaranJobs
```json
{
  "id": 1,
  "title": "Information Management Officer",
  "company": "DRC – Danish Refugee Council",
  "location": "Mogadishu, Somalia",
  "type": "NGO",
  "date_posted": "4 weeks ago",
  "deadline": "June 07, 2026",
  "description": "Support effective management, quality assurance, analysis, and utilization of programmatic data.",
  "url": "https://qaranjobs.com/job/information-management-officer-mogadishu-somalia-15/",
  "source": "QaranJobs",
  "engagement": 45
}
```

### Web Scraping Code (Python Example)
```python
import requests
from bs4 import BeautifulSoup
import time

def scrape_qaranjobs():
    url = "https://qaranjobs.com/category/jobs-in-somalia/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    jobs = []
    for job_card in soup.find_all('div', class_='job-card'):
        job = {
            'title': job_card.find('h2').text.strip(),
            'company': job_card.find('span', class_='company').text.strip(),
            'location': job_card.find('span', class_='location').text.strip(),
            'url': job_card.find('a')['href'],
            'source': 'QaranJobs'
        }
        jobs.append(job)
        time.sleep(1)  # Rate limiting
    
    return jobs
```

---

## 2. SomaliJobs API

**Website:** https://somalijobs.com  
**Type:** Local Somalia Job Board  
**Authentication:** None required

### Endpoint Structure
```
GET https://somalijobs.com/jobs/somalia
GET https://somalijobs.com/jobs/{job_id}
```

### Data Extraction Method
- **Method:** Web scraping
- **Tools:** Cheerio, Puppeteer
- **Rate Limit:** Implement 2-3 second delays

### Example Job Data
```json
{
  "id": 10,
  "title": "Stakeholder Engagement Specialist",
  "company": "Federal Government of Somalia",
  "location": "Multiple locations across Somalia",
  "type": "Government",
  "description": "Coordinate stakeholder engagement and community relations.",
  "url": "https://somalijobs.com/jobs/somalia/12448195797031128/stakeholder-engagement-specialist",
  "source": "SomaliJobs",
  "engagement": 33
}
```

---

## 3. LinkedIn API

**Website:** https://so.linkedin.com  
**Type:** Professional Network  
**Official API:** LinkedIn Jobs API (requires enterprise account)

### Official LinkedIn API (Enterprise)
```
Endpoint: https://api.linkedin.com/v2/jobs
Method: GET
Authentication: OAuth 2.0 Bearer Token
```

### Authentication Flow
```bash
# Step 1: Register application at https://www.linkedin.com/developers/apps
# Step 2: Get Client ID and Client Secret
# Step 3: Request access token

curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

### API Request Example
```javascript
const axios = require('axios');

async function getLinkedInJobs() {
  const accessToken = 'YOUR_ACCESS_TOKEN';
  
  const response = await axios.get('https://api.linkedin.com/v2/jobs', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    },
    params: {
      q: 'Somalia',
      location: 'Mogadishu'
    }
  });
  
  return response.data;
}
```

### Web Scraping Alternative (No API Key)
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def scrape_linkedin_jobs():
    driver = webdriver.Chrome()
    driver.get("https://so.linkedin.com/jobs/jobs-in-mogadishu")
    
    time.sleep(3)  # Wait for page load
    
    jobs = []
    job_cards = driver.find_elements(By.CLASS_NAME, "base-card")
    
    for card in job_cards:
        job = {
            'title': card.find_element(By.CLASS_NAME, "base-search-card__title").text,
            'company': card.find_element(By.CLASS_NAME, "base-search-card__subtitle").text,
            'url': card.find_element(By.TAG_NAME, "a").get_attribute("href"),
            'source': 'LinkedIn'
        }
        jobs.append(job)
    
    driver.quit()
    return jobs
```

---

## 4. Upwork API

**Website:** https://www.upwork.com  
**Official API:** Upwork API v2  
**Authentication:** OAuth 1.0a

### API Endpoints
```
GET https://api.upwork.com/jobs/v2/search
GET https://api.upwork.com/jobs/v2/{job_id}
```

### Authentication Setup
```bash
# 1. Register at https://www.upwork.com/ab/account-security/api
# 2. Get API Key and Secret
# 3. Implement OAuth 1.0a flow
```

### API Request Example (Node.js)
```javascript
const OAuth = require('oauth').OAuth;

const oauth = new OAuth(
  'https://api.upwork.com/oauth/token/request',
  'https://api.upwork.com/oauth/token/access',
  'YOUR_API_KEY',
  'YOUR_API_SECRET',
  '1.0',
  null,
  'HMAC-SHA1'
);

function searchUpworkJobs() {
  oauth.get(
    'https://api.upwork.com/jobs/v2/search?q=Somalia&l=Mogadishu',
    'YOUR_ACCESS_TOKEN',
    'YOUR_ACCESS_TOKEN_SECRET',
    function(error, data) {
      if (error) console.error(error);
      else console.log(JSON.parse(data));
    }
  );
}
```

### Response Format
```json
{
  "jobs": [
    {
      "id": "11",
      "title": "English to Somali Translator",
      "description": "Translate documents from English to Somali",
      "category": "Translation",
      "budget": "$50-200",
      "url": "https://www.upwork.com/jobs/~...",
      "source": "Upwork",
      "engagement": 67
    }
  ]
}
```

---

## 5. Fiverr API

**Website:** https://www.fiverr.com  
**Official API:** Limited public API  
**Alternative:** Web scraping required

### Fiverr Search Endpoint (Unofficial)
```
GET https://www.fiverr.com/api/search/gigs
```

### Web Scraping with Puppeteer
```javascript
const puppeteer = require('puppeteer');

async function scrapeFiverr() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://www.fiverr.com/search/gigs?q=somali');
  
  const gigs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.gig-card')).map(card => ({
      title: card.querySelector('.gig-title').textContent,
      seller: card.querySelector('.seller-name').textContent,
      price: card.querySelector('.price').textContent,
      rating: card.querySelector('.rating').textContent,
      url: card.querySelector('a').href
    }));
  });
  
  await browser.close();
  return gigs;
}
```

---

## 6. Indeed API

**Website:** https://www.indeed.com  
**Official API:** Indeed Publisher API  
**Authentication:** API Key required

### API Endpoints
```
GET https://api.indeed.com/ads/apisearch
Parameters:
  - publisher: YOUR_PUBLISHER_ID
  - q: query (e.g., "Somalia")
  - l: location
  - sort: date or relevance
  - format: json
```

### API Request Example
```bash
curl "https://api.indeed.com/ads/apisearch?publisher=YOUR_ID&q=Somalia&l=Mogadishu&sort=date&format=json"
```

### JavaScript Implementation
```javascript
async function searchIndeedJobs() {
  const response = await fetch(
    'https://api.indeed.com/ads/apisearch?' + new URLSearchParams({
      publisher: 'YOUR_PUBLISHER_ID',
      q: 'Somalia',
      l: 'Mogadishu',
      sort: 'date',
      format: 'json'
    })
  );
  
  const data = await response.json();
  return data.results;
}
```

### Response Format
```json
{
  "results": [
    {
      "jobtitle": "Application Developer",
      "company": "Tech Solutions Ltd",
      "city": "Mogadishu",
      "state": "Somalia",
      "country": "SO",
      "formattedLocation": "Mogadishu, Somalia",
      "source": "Tech Solutions Ltd",
      "date": "2026-06-24",
      "snippet": "Develop mobile and web applications...",
      "position": "1",
      "jobkey": "...",
      "sponsored": false,
      "expired": false,
      "indeedApply": true,
      "formattedLocationFull": "Mogadishu, Somalia",
      "noUniqueUrl": false,
      "postingUrl": "https://www.indeed.com/viewjob?jk=..."
    }
  ]
}
```

---

## 7. Facebook Jobs API

**Website:** https://www.facebook.com/jobs  
**Official API:** Facebook Graph API  
**Authentication:** OAuth 2.0

### Graph API Endpoint
```
GET https://graph.facebook.com/v18.0/{page-id}/jobs
```

### Setup Instructions
```bash
# 1. Create Facebook App at https://developers.facebook.com
# 2. Add Jobs plugin
# 3. Get Access Token
# 4. Request necessary permissions: pages_read_engagement, jobs_read
```

### API Request Example
```javascript
const axios = require('axios');

async function getFacebookJobs() {
  const response = await axios.get(
    'https://graph.facebook.com/v18.0/YOUR_PAGE_ID/jobs',
    {
      params: {
        access_token: 'YOUR_ACCESS_TOKEN',
        fields: 'id,title,description,location,application_url'
      }
    }
  );
  
  return response.data.data;
}
```

---

## 8. Arc.dev API

**Website:** https://arc.dev  
**Official API:** Limited  
**Method:** Web scraping

### Web Scraping Approach
```javascript
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeArcDev() {
  const response = await axios.get('https://arc.dev/en-so/remote-jobs');
  const $ = cheerio.load(response.data);
  
  const jobs = [];
  $('.job-card').each((index, element) => {
    jobs.push({
      title: $(element).find('.job-title').text(),
      company: $(element).find('.company-name').text(),
      description: $(element).find('.job-description').text(),
      url: $(element).find('a').attr('href'),
      source: 'Arc.dev'
    });
  });
  
  return jobs;
}
```

---

## 9. Freelancer.com API

**Website:** https://www.freelancer.com  
**Official API:** Freelancer API v2  
**Authentication:** OAuth 2.0

### API Endpoints
```
GET https://api.freelancer.com/0.1/projects/search
GET https://api.freelancer.com/0.1/projects/{project_id}
```

### Authentication
```bash
# Register at https://developers.freelancer.com
# Get API Key and Secret
# Implement OAuth 2.0 flow
```

### API Request Example
```javascript
const axios = require('axios');

async function searchFreelancerJobs() {
  const response = await axios.get(
    'https://api.freelancer.com/0.1/projects/search',
    {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
      },
      params: {
        query: 'Somalia',
        limit: 20
      }
    }
  );
  
  return response.data.projects;
}
```

---

## 10. ZipRecruiter API

**Website:** https://www.ziprecruiter.com  
**Official API:** ZipRecruiter API  
**Authentication:** API Key required

### API Endpoint
```
GET https://api.ziprecruiter.com/jobs/search
Parameters:
  - api_key: YOUR_API_KEY
  - search: query
  - location: location
```

### API Request Example
```bash
curl "https://api.ziprecruiter.com/jobs/search?api_key=YOUR_KEY&search=Somalia&location=Mogadishu"
```

### JavaScript Implementation
```javascript
async function searchZipRecruiter() {
  const response = await fetch(
    'https://api.ziprecruiter.com/jobs/search?' + new URLSearchParams({
      api_key: 'YOUR_API_KEY',
      search: 'Somalia',
      location: 'Mogadishu'
    })
  );
  
  const data = await response.json();
  return data.jobs;
}
```

---

## 🔄 Data Integration Strategy

### Current Implementation (Static Data)
All job data is hardcoded in `client/src/pages/Home.tsx` as a static array.

### Recommended: Dynamic Data Loading

#### Option 1: Backend API (Node.js + Express)
```typescript
// server/routes/jobs.ts
import express from 'express';
import { scrapeQaranJobs } from '../scrapers/qaranjobs';
import { searchUpworkJobs } from '../services/upwork';

const router = express.Router();

router.get('/jobs', async (req, res) => {
  try {
    const [qaranJobs, upworkJobs, linkedinJobs] = await Promise.all([
      scrapeQaranJobs(),
      searchUpworkJobs(),
      scrapeLinkedIn()
    ]);
    
    const allJobs = [...qaranJobs, ...upworkJobs, ...linkedinJobs];
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### Option 2: Client-Side Fetch
```typescript
// client/src/hooks/useJobs.ts
import { useState, useEffect } from 'react';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchJobs();
  }, []);
  
  return { jobs, loading };
}
```

---

## 🛠️ Web Scraping Tools & Libraries

### Python
- **BeautifulSoup4:** HTML parsing
- **Selenium:** Browser automation
- **Scrapy:** Full-featured scraping framework
- **Requests:** HTTP library

### Node.js
- **Puppeteer:** Headless browser
- **Cheerio:** jQuery-like syntax for parsing
- **Axios:** HTTP client
- **Nightmare:** High-level browser automation

### Installation
```bash
# Python
pip install beautifulsoup4 selenium requests scrapy

# Node.js
npm install puppeteer cheerio axios nightmare
```

---

## 📊 Data Aggregation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│              Somalia Job Board UI                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│              Job Aggregation Service                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ▼            ▼            ▼             ▼
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │QaranJobs│ │LinkedIn│ │Upwork  │ │Indeed  │
    │(Scrape) │ │(API)   │ │(API)   │ │(API)   │
    └────────┘  └────────┘  └────────┘  └────────┘
```

---

## 🔐 API Key Management

### Environment Variables
Create `.env` file:
```
UPWORK_API_KEY=your_key
UPWORK_API_SECRET=your_secret
INDEED_PUBLISHER_ID=your_id
LINKEDIN_ACCESS_TOKEN=your_token
FACEBOOK_ACCESS_TOKEN=your_token
FREELANCER_API_KEY=your_key
ZIPRECRUITER_API_KEY=your_key
```

### Usage in Code
```typescript
const upworkKey = process.env.UPWORK_API_KEY;
const indeedId = process.env.INDEED_PUBLISHER_ID;
```

---

## 📈 Rate Limiting & Best Practices

1. **Respect robots.txt** - Check before scraping
2. **Implement delays** - 2-5 seconds between requests
3. **Use User-Agent headers** - Identify your bot
4. **Cache results** - Store data locally to reduce requests
5. **Handle errors gracefully** - Retry with exponential backoff
6. **Monitor API usage** - Track quota and costs

---

## 🚀 Deployment Considerations

### API Keys in Production
- Use environment variables
- Never commit keys to Git
- Rotate keys regularly
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)

### Rate Limiting
- Implement request throttling
- Use Redis for distributed rate limiting
- Cache responses with TTL

### Monitoring
- Log all API calls
- Monitor error rates
- Set up alerts for failures

---

**Last Updated:** June 30, 2026
