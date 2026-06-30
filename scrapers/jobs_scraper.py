#!/usr/bin/env python3
"""
Somalia Job Board - Automated Web Scraper
Scrapes jobs from local Somalia job sources: QaranJobs, SomaliJobs, and social media
Completely FREE using open-source tools
"""

import requests
from bs4 import BeautifulSoup
import json
import sqlite3
from datetime import datetime
import time
import logging
from typing import List, Dict
import re

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Database path
DB_PATH = 'jobs.db'

class JobsScraper:
    """Main scraper class for Somalia job sources"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.jobs = []
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database for storing jobs"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT UNIQUE,
                title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                job_type TEXT,
                description TEXT,
                url TEXT UNIQUE,
                source TEXT,
                date_posted TIMESTAMP,
                deadline TEXT,
                engagement INTEGER DEFAULT 0,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(url)
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized")
    
    def save_jobs(self, jobs: List[Dict]):
        """Save jobs to database"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        added = 0
        updated = 0
        
        for job in jobs:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO jobs 
                    (job_id, title, company, location, job_type, description, url, source, date_posted, deadline, engagement)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    job.get('id', job.get('url')),
                    job.get('title'),
                    job.get('company'),
                    job.get('location'),
                    job.get('type', 'NGO'),
                    job.get('description'),
                    job.get('url'),
                    job.get('source'),
                    job.get('date_posted'),
                    job.get('deadline'),
                    job.get('engagement', 0)
                ))
                added += 1
            except sqlite3.IntegrityError:
                updated += 1
        
        conn.commit()
        conn.close()
        logger.info(f"Saved {added} new jobs, updated {updated} existing jobs")
        return added, updated
    
    def get_all_jobs(self) -> List[Dict]:
        """Retrieve all jobs from database"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM jobs ORDER BY date_posted DESC')
        rows = cursor.fetchall()
        conn.close()
        
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0],
                'job_id': row[1],
                'title': row[2],
                'company': row[3],
                'location': row[4],
                'type': row[5],
                'description': row[6],
                'url': row[7],
                'source': row[8],
                'date_posted': row[9],
                'deadline': row[10],
                'engagement': row[11]
            })
        
        return jobs
    
    def export_to_json(self, filename='jobs.json'):
        """Export jobs to JSON file for frontend"""
        jobs = self.get_all_jobs()
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, ensure_ascii=False, indent=2)
        logger.info(f"Exported {len(jobs)} jobs to {filename}")
    
    # ============ SCRAPER METHODS FOR EACH SOURCE ============
    
    def scrape_qaranjobs(self) -> List[Dict]:
        """Scrape jobs from QaranJobs.com"""
        logger.info("Scraping QaranJobs...")
        jobs = []
        
        try:
            url = "https://qaranjobs.com/category/jobs-in-somalia/"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all job listings
            job_cards = soup.find_all('article', class_='post')
            
            for card in job_cards:
                try:
                    title_elem = card.find('h2', class_='entry-title')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    link = title_elem.find('a')
                    job_url = link['href'] if link else None
                    
                    # Get company from content
                    content = card.find('div', class_='entry-content')
                    company = "QaranJobs"
                    
                    # Try to extract location
                    location = "Somalia"
                    if content:
                        text = content.get_text()
                        if 'Mogadishu' in text:
                            location = 'Mogadishu, Somalia'
                        elif 'Nairobi' in text:
                            location = 'Nairobi, Kenya'
                    
                    job = {
                        'id': job_url.split('/')[-2] if job_url else title,
                        'title': title,
                        'company': company,
                        'location': location,
                        'type': 'NGO',
                        'description': content.get_text(strip=True)[:200] if content else '',
                        'url': job_url,
                        'source': 'QaranJobs',
                        'date_posted': datetime.now().isoformat(),
                        'engagement': 0
                    }
                    jobs.append(job)
                    logger.info(f"Found: {title}")
                except Exception as e:
                    logger.warning(f"Error parsing job card: {e}")
                    continue
            
            time.sleep(2)  # Rate limiting
        
        except Exception as e:
            logger.error(f"Error scraping QaranJobs: {e}")
        
        logger.info(f"QaranJobs: Found {len(jobs)} jobs")
        return jobs
    
    def scrape_somalijobs(self) -> List[Dict]:
        """Scrape jobs from SomaliJobs.com"""
        logger.info("Scraping SomaliJobs...")
        jobs = []
        
        try:
            url = "https://somalijobs.com/jobs/somalia"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all job listings
            job_cards = soup.find_all('div', class_='job-card')
            
            for card in job_cards:
                try:
                    title_elem = card.find('h3')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    link = card.find('a')
                    job_url = link['href'] if link else None
                    
                    # Get company
                    company_elem = card.find('span', class_='company')
                    company = company_elem.get_text(strip=True) if company_elem else 'SomaliJobs'
                    
                    # Get location
                    location_elem = card.find('span', class_='location')
                    location = location_elem.get_text(strip=True) if location_elem else 'Somalia'
                    
                    # Get description
                    desc_elem = card.find('p', class_='description')
                    description = desc_elem.get_text(strip=True)[:200] if desc_elem else ''
                    
                    job = {
                        'id': job_url.split('/')[-1] if job_url else title,
                        'title': title,
                        'company': company,
                        'location': location,
                        'type': 'Government',
                        'description': description,
                        'url': job_url,
                        'source': 'SomaliJobs',
                        'date_posted': datetime.now().isoformat(),
                        'engagement': 0
                    }
                    jobs.append(job)
                    logger.info(f"Found: {title}")
                except Exception as e:
                    logger.warning(f"Error parsing job card: {e}")
                    continue
            
            time.sleep(2)  # Rate limiting
        
        except Exception as e:
            logger.error(f"Error scraping SomaliJobs: {e}")
        
        logger.info(f"SomaliJobs: Found {len(jobs)} jobs")
        return jobs
    
    def scrape_facebook_jobs(self) -> List[Dict]:
        """
        Scrape jobs from Facebook Jobs
        Note: Facebook requires authentication, so we'll use a simpler approach
        """
        logger.info("Scraping Facebook Jobs (limited - requires authentication)...")
        jobs = []
        
        # Facebook requires login, so we'll skip automated scraping
        # Users can manually add Facebook jobs or use Facebook API with credentials
        logger.info("Facebook: Skipped (requires authentication)")
        
        return jobs
    
    def scrape_twitter_jobs(self) -> List[Dict]:
        """Scrape job posts from Twitter/X"""
        logger.info("Scraping Twitter/X jobs...")
        jobs = []
        
        # Twitter/X requires API authentication
        # For free tier, we can search for tweets with job keywords
        # This requires Twitter API v2 bearer token (free tier available)
        
        logger.info("Twitter/X: Requires API authentication")
        return jobs
    
    def scrape_instagram_jobs(self) -> List[Dict]:
        """Scrape job posts from Instagram"""
        logger.info("Scraping Instagram jobs...")
        jobs = []
        
        # Instagram requires authentication and has strict scraping policies
        # Better to use hashtag monitoring or manual collection
        
        logger.info("Instagram: Requires authentication")
        return jobs
    
    def run_all_scrapers(self) -> Dict:
        """Run all scrapers and collect jobs"""
        logger.info("=" * 50)
        logger.info("Starting job scraping cycle")
        logger.info("=" * 50)
        
        all_jobs = []
        
        # Run scrapers
        all_jobs.extend(self.scrape_qaranjobs())
        all_jobs.extend(self.scrape_somalijobs())
        all_jobs.extend(self.scrape_facebook_jobs())
        all_jobs.extend(self.scrape_twitter_jobs())
        all_jobs.extend(self.scrape_instagram_jobs())
        
        # Save to database
        added, updated = self.save_jobs(all_jobs)
        
        # Export to JSON
        self.export_to_json()
        
        logger.info("=" * 50)
        logger.info(f"Scraping complete: {added} new, {updated} updated")
        logger.info("=" * 50)
        
        return {
            'total_jobs': len(all_jobs),
            'added': added,
            'updated': updated,
            'timestamp': datetime.now().isoformat()
        }


def main():
    """Main entry point"""
    scraper = JobsScraper()
    result = scraper.run_all_scrapers()
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
