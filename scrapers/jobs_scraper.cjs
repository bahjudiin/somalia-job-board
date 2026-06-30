#!/usr/bin/env node
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const JOBS_JSON = path.join(__dirname, "..", "client", "public", "jobs.json");

class JobsScraper {
  constructor() {
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5"
    };
    this.jobs = [];
    this.seenUrls = new Set();
  }

  addJob(job) {
    if (!job.title || !job.url) return;
    const key = job.url.trim().toLowerCase();
    if (this.seenUrls.has(key)) return;
    this.seenUrls.add(key);
    this.jobs.push({
      id: this.jobs.length + 1,
      title: job.title.trim().slice(0, 150),
      company: (job.company || "Unknown").trim().slice(0, 100),
      location: (job.location || "Somalia").trim().slice(0, 100),
      type: job.type || "NGO",
      date_posted: job.date_posted || "Recent",
      deadline: job.deadline || "Ongoing",
      description: (job.description || "").trim().slice(0, 300),
      url: job.url.trim(),
      source: job.source || "Unknown",
      engagement: job.engagement || Math.floor(Math.random() * 60) + 10
    });
  }

  extractLocation(text) {
    const locations = [
      "Mogadishu", "Hargeisa", "Garowe", "Kismayo", "Baidoa",
      "Bosaso", "Galkayo", "Jowhar", "Beledweyne", "Dhusamareeb",
      "Berbera", "Borama", "Burao", "Erigavo", "Lasanod"
    ];
    for (const loc of locations) {
      if (text.includes(loc)) return loc + (loc === "Hargeisa" ? ", Somaliland" : ", Somalia");
    }
    return "Somalia";
  }

  extractType(text) {
    if (text.match(/ngo|un|world vision|unicef|wfp|undp|drc|iom/i)) return "NGO";
    if (text.match(/government|federal|ministry|state/i)) return "Government";
    if (text.match(/private|company|limited|llc|agency/i)) return "Private";
    return "NGO";
  }

  extractCompany(text) {
    const orgs = [
      "UNICEF", "UNDP", "WFP", "World Vision", "DRC", "IOM", "WHO",
      "UNFPA", "OXFAM", "Save the Children", "IRC", "FAO", "UNHCR",
      "Norwegian Refugee Council", "Danish Refugee Council", "CTG",
      "Federal Government of Somalia", "World Health Organization"
    ];
    for (const org of orgs) {
      if (text.includes(org)) return org;
    }
    const companyMatch = text.match(/(?:Company|Organization|Hay.ad|Shirkad)[:\s]+([^\n]+)/i);
    return companyMatch ? companyMatch[1].trim() : "Somali Employer";
  }

  async scrapeQaranJobs() {
    console.log("  → QaranJobs...");
    try {
      const { data } = await axios.get("https://qaranjobs.com/", {
        headers: this.headers, timeout: 15000
      });
      const postUrls = [...data.matchAll(/href="([^"]+qaranjobs\.com\/[^"]+)"/g)].map((m) => m[1]);
      const unique = [...new Set(postUrls.filter((u) => !u.includes("wp-") && !u.includes("xmlrpc") && !u.includes("feed") && !u.includes("category") && !u.includes("#") && u !== "https://qaranjobs.com/"))];
      console.log(`    Found ${unique.length} pages`);
    } catch (e) {
      console.warn("    Skipped (blocked/dynamic)");
    }
  }

  async scrapeSomaliJobs() {
    console.log("  → SomaliJobs (via Telegram)...");
    try {
      const { data } = await axios.get("https://t.me/s/somalijobsinc", {
        headers: this.headers, timeout: 15000
      });
      const messages = [...data.matchAll(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g)];
      console.log(`    ${messages.length} messages from Telegram backup`);
    } catch (e) {
      console.warn("    Skipped");
    }
  }

  async scrapeShaqoHel() {
    console.log("  → ShaqoHel...");
    try {
      const { data } = await axios.get("https://shaqohel.com/jobs/", {
        headers: this.headers, timeout: 15000
      });
      const $ = cheerio.load(data);
      $("a[href*='post_type=job_listing'], a[href*='/jobs/']").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("p=")) {
          const text = $(el).text().trim() || $(el).find("h3, h4, strong").text().trim();
          if (text) {
            this.addJob({
              title: text,
              url: href,
              company: "ShaqoHel",
              location: "Somalia",
              type: "NGO",
              source: "ShaqoHel",
              description: text
            });
          }
        }
      });
      console.log(`    Found ${this.jobs.filter((j) => j.source === "ShaqoHel").length} jobs`);
    } catch (e) {
      console.warn("    Skipped:", e.message);
    }
  }

  async scrapeJoblink() {
    console.log("  → Joblink.so...");
    try {
      const { data } = await axios.get("https://joblink.so/jobs/", {
        headers: this.headers, timeout: 15000
      });
      const jobUrls = [...data.matchAll(/href="([^"]+\/job\/[^"]+)"/g)].map((m) => m[1]);
      const unique = [...new Set(jobUrls)];
      console.log(`    Found ${unique.length} job URLs`);

      for (const url of unique.slice(0, 15)) {
        try {
          await new Promise((r) => setTimeout(r, 500));
          const { data: jobHtml } = await axios.get(url, {
            headers: this.headers, timeout: 10000
          });
          const $ = cheerio.load(jobHtml);
          const title = $("h1, h2.entry-title, .job-title").first().text().trim();
          const content = $(".job-description, .entry-content, .job-details").text().trim();
          if (title) {
            const location = content.includes("Mogadishu") ? "Mogadishu, Somalia"
              : content.includes("Hargeisa") ? "Hargeisa, Somaliland"
              : content.includes("Garowe") ? "Garowe, Somalia" : "Somalia";
            this.addJob({
              title,
              url,
              company: "Joblink.so",
              location,
              type: this.extractType(content),
              source: "Joblink.so",
              description: content.slice(0, 300)
            });
          }
        } catch (e) {
          // skip failed individual pages
        }
      }
      console.log(`    Scraped ${this.jobs.filter((j) => j.source === "Joblink.so").length} job details`);
    } catch (e) {
      console.warn("    Skipped:", e.message);
    }
  }

  async scrapeTelegramChannel(channel, sourceName) {
    console.log(`  → Telegram @${channel}...`);
    let totalFetched = 0;
    let before = "";

    for (let page = 0; page < 3; page++) {
      try {
        const url = before ? `https://t.me/s/${channel}?before=${before}` : `https://t.me/s/${channel}`;
        const { data } = await axios.get(url, {
          headers: { ...this.headers, Accept: "text/html,application/xhtml+xml" },
          timeout: 15000
        });

        const $ = cheerio.load(data);
        const messages = $(".tgme_widget_message_wrap");
        if (messages.length === 0) break;

        let lastId = "";
        messages.each((_, el) => {
          const msgEl = $(el).find(".tgme_widget_message");
          const textEl = msgEl.find(".tgme_widget_message_text");
          const text = textEl.text().trim();
          const postId = msgEl.attr("data-post") || "";
          const msgUrl = `https://t.me/${channel}/${postId.split("/").pop()}`;
          const datetime = msgEl.find("time").attr("datetime") || "";

          if (postId) lastId = postId;

          if (!text) return;
          const isJob = text.match(/fursad|shaqo|vacancy|hiring|job|career|opportunity|boos|jagad|deadline/i);
          if (!isJob) return;

          const lines = text.split("\n").filter((l) => l.trim());
          let title = "";
          for (const line of lines) {
            if (line.match(/booska|jagada|title|position|vacancy|hiring|fursad/i)) {
              title = line.replace(/^[🟢📢🎯📍🔴🚨🎉✅]+/, "").replace(/^[📌🎯]+/, "").trim();
            }
          }
          if (!title && lines.length > 0) title = lines[0].replace(/^[🟢📢🎯📍🔴🚨🎉✅]+/, "").trim();
          if (!title) title = "Job Opportunity";
          if (title.length > 150) title = title.slice(0, 150);

          const location = this.extractLocation(text);
          const type = this.extractType(text);
          const company = this.extractCompany(text);

          this.addJob({
            title,
            url: msgUrl,
            company,
            location,
            type,
            source: `@${channel}`,
            description: text.slice(0, 300).replace(/https?:\/\/\S+/g, "").trim(),
            date_posted: datetime ? new Date(datetime).toISOString().split("T")[0] : "Recent"
          });
          totalFetched++;
        });

        if (lastId) {
          before = lastId.split("/").pop();
        } else {
          break;
        }

        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        break;
      }
    }
    console.log(`    Fetched ${totalFetched} job posts (${before ? "paginated" : "single page"})`);
  }

  async scrapeTelegram() {
    await this.scrapeTelegramChannel("somalijobsinc", "SomaliJobs");
    await this.scrapeTelegramChannel("qaran_jobs", "QaranJobs");
    await this.scrapeTelegramChannel("shaqohel", "ShaqoHel");
  }

  saveJson() {
    const dir = path.dirname(JOBS_JSON);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JOBS_JSON, JSON.stringify(this.jobs, null, 2), "utf-8");
    console.log(`\n✓ Written ${this.jobs.length} jobs to ${JOBS_JSON}`);
  }

  async runAll() {
    console.log("=".repeat(50));
    console.log("Somalia Job Scraper — starting");
    console.log("=".repeat(50) + "\n");

    console.log("--- Websites ---");
    await this.scrapeQaranJobs();
    await this.scrapeShaqoHel();
    await this.scrapeJoblink();

    console.log("\n--- Telegram ---");
    await this.scrapeTelegram();

    this.saveJson();
    console.log("\n✓ Done");
    return { total: this.jobs.length };
  }
}

async function main() {
  const scraper = new JobsScraper();
  await scraper.runAll();
}

if (require.main === module) main();
module.exports = JobsScraper;
