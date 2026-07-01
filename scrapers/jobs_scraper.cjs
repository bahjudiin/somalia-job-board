#!/usr/bin/env node
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const JOBS_JSON = path.join(__dirname, "..", "client", "public", "jobs.json");
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const TIME_FILTERS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
};

const EXPIRY_MS = TIME_FILTERS[process.env.TIME_FILTER || "30d"] || TIME_FILTERS["30d"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class JobsScraper {
  constructor() {
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    };
    this.jobs = [];
    this.seenUrls = new Set();
    this.failedChannels = [];
    this.stats = { telegram: 0, impactpool: 0, shaqohel: 0, joblink: 0 };
  }

  addJob(job) {
    if (!job.title || !job.url) return;
    const key = job.url.trim().toLowerCase();
    if (this.seenUrls.has(key)) return;
    this.seenUrls.add(key);

    const datePosted = job.date_posted || "Recent";
    if (EXPIRY_MS !== Infinity && datePosted !== "Recent") {
      const jobDate = new Date(datePosted);
      if (!isNaN(jobDate.getTime()) && Date.now() - jobDate.getTime() > EXPIRY_MS) return;
    }

    this.jobs.push({
      id: this.jobs.length + 1,
      title: job.title.trim().slice(0, 150),
      company: (job.company || "Unknown").trim().slice(0, 100),
      location: (job.location || "Somalia").trim().slice(0, 100),
      type: job.type || "NGO",
      date_posted: datePosted,
      deadline: job.deadline || "Ongoing",
      description: (job.description || "").trim().slice(0, 300),
      url: job.url.trim(),
      original_url: job.original_url || null,
      source: job.source || "Unknown",
      engagement: job.engagement || Math.floor(Math.random() * 60) + 10,
    });
  }

  loadExistingJobs() {
    try {
      if (fs.existsSync(JOBS_JSON)) {
        const existing = JSON.parse(fs.readFileSync(JOBS_JSON, "utf-8"));
        for (const job of existing) {
          const key = (job.url || "").trim().toLowerCase();
          if (key && !this.seenUrls.has(key)) {
            this.seenUrls.add(key);
            this.jobs.push(job);
          }
        }
        console.log(`  Loaded ${this.jobs.length} existing jobs as fallback`);
      }
    } catch (e) {
      console.log(`  No existing jobs.json found or failed to parse: ${e.message}`);
    }
  }

  extractLocation(text) {
    const locations = [
      "Mogadishu", "Hargeisa", "Garowe", "Kismayo", "Baidoa",
      "Bosaso", "Galkayo", "Jowhar", "Beledweyne", "Dhusamareeb",
      "Berbera", "Borama", "Burao", "Erigavo", "Lasanod",
      "Nairobi", "Addis Ababa", "Remote",
    ];
    for (const loc of locations) {
      if (text.includes(loc)) {
        if (loc === "Hargeisa") return "Hargeisa, Somaliland";
        if (loc === "Nairobi") return "Nairobi, Kenya";
        if (loc === "Addis Ababa") return "Addis Ababa, Ethiopia";
        if (loc === "Remote") return "Remote";
        return loc + ", Somalia";
      }
    }
    return "Somalia";
  }

  extractType(text) {
    if (text.match(/ngo|un |un,|unicef|wfp|undp|drc|iom|who |unfpa|oxfam/i)) return "NGO";
    if (text.match(/government|federal|ministry|state |public/i)) return "Government";
    if (text.match(/private|company|limited|llc|agency|bank|telecom/i)) return "Private";
    if (text.match(/remote|work from home|telecommute/i)) return "Remote";
    return "NGO";
  }

  extractCompany(text) {
    const orgs = [
      "UNICEF", "UNDP", "WFP", "World Vision", "DRC", "IOM", "WHO",
      "UNFPA", "OXFAM", "Save the Children", "IRC", "FAO", "UNHCR",
      "Norwegian Refugee Council", "Danish Refugee Council", "CTG",
      "Federal Government of Somalia", "World Health Organization",
      "Somali Civil Aviation Authority", "Hormuud", "Somtel", "Dahabshiil",
      "Amal Bank", "Salaam Bank", "Zaad", "Telesom", "SOS Children",
      "Mercy Corps", "IMC", "Médecins Sans Frontières", "MSF",
      "International Rescue Committee", "CARE", "NRC", "ACF",
    ];
    for (const org of orgs) {
      if (text.includes(org)) return org;
    }
    const companyMatch = text.match(
      /(?:Company|Organization|Hay\.ad|Shirkad|Employer)[:\s]+([^\n,]+)/i
    );
    return companyMatch ? companyMatch[1].trim().slice(0, 80) : "Somali Employer";
  }

  extractOriginalUrl(text) {
    const sites = [
      "somalijobs.com", "shaqohel.com", "qaranjobs.com", "joblink.so",
      "somalijobs.net", "goobjoog.com", "masterjobsafrica.com",
      "reliefweb.int", "impactpool.org", "devjobsscanner.com",
    ];
    const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
    const urls = text.match(urlRegex) || [];
    for (const url of urls) {
      const clean = url.replace(/[.,;!?\s]+$/, "");
      for (const site of sites) {
        if (clean.includes(site)) return clean;
      }
    }
    return null;
  }

  cleanTitle(text) {
    return text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/#\w+/g, "")
      .replace(/@\w+/g, "")
      .replace(/^[🟢📢🎯📍🔴🚨🎉✅📌🔹🔸]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async fetchWithRetry(url, retries = MAX_RETRIES, extraHeaders = {}) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await axios.get(url, {
          headers: { ...this.headers, ...extraHeaders },
          timeout: 20000,
        });
      } catch (err) {
        const isLast = attempt === retries;
        const delay = RETRY_DELAY_MS * attempt;
        if (isLast) {
          console.log(`    ✗ Failed after ${retries} attempts: ${err.message}`);
          throw err;
        }
        console.log(
          `    ⟳ Attempt ${attempt} failed (${err.message}), retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  // ──────────────────────────────────────────────
  //  TELEGRAM
  // ──────────────────────────────────────────────
  async scrapeTelegramChannel(channel) {
    console.log(`  → Telegram @${channel}...`);
    let totalFetched = 0;
    let before = "";

    for (let page = 0; page < 4; page++) {
      try {
        const url = before
          ? `https://t.me/s/${channel}?before=${before}`
          : `https://t.me/s/${channel}`;
        const { data } = await this.fetchWithRetry(url);

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

          const isJob = text.match(
            /fursad|shaqo|vacancy|hiring|job|career|opportunity|boos|jagad|deadline|macalin|teacher|engineer|nurse|doctor|manager|director|officer|coordinator|specialist|analyst|assistant|intern/i
          );
          if (!isJob) return;

          const title = this.cleanTitle(
            text
              .split("\n")
              .find((l) =>
                l.match(
                  /booska|jagada|title|position|vacancy|hiring|fursad|macalin|teacher|engineer|nurse|doctor|manager|director|officer|coordinator|specialist/i
                )
              ) ||
              text.split("\n")[0] ||
              "Job Opportunity"
          );

          const originalUrl = this.extractOriginalUrl(text);
          const location = this.extractLocation(text);
          const type = this.extractType(text);
          const company = this.extractCompany(text);
          const cleanText = text
            .replace(/https?:\/\/\S+/g, "")
            .replace(/#\w+/g, "")
            .trim();

          this.addJob({
            title: title.slice(0, 150),
            url: originalUrl || msgUrl,
            original_url: originalUrl,
            company,
            location,
            type,
            source: `@${channel}`,
            description: cleanText.slice(0, 300),
            date_posted: datetime
              ? new Date(datetime).toISOString().split("T")[0]
              : "Recent",
          });
          totalFetched++;
        });

        if (lastId) {
          before = lastId.split("/").pop();
        } else {
          break;
        }

        await sleep(1500);
      } catch (e) {
        break;
      }
    }
    console.log(
      `    Fetched ${totalFetched} job posts (${before ? "paginated" : "single page"})`
    );
    return totalFetched;
  }

  async scrapeTelegram() {
    const channels = [
      "somalijobsinc",
      "shaqohel",
      "somalijobsweb",
      "Somalijobs24",
      "Ethiosomalijobs",
    ];
    let successCount = 0;
    for (const ch of channels) {
      try {
        const count = await this.scrapeTelegramChannel(ch);
        if (count > 0) {
          successCount++;
          this.stats.telegram += count;
        }
      } catch (e) {
        console.log(`  ✗ @${ch} failed: ${e.message}`);
        this.failedChannels.push(ch);
      }
    }
    return {
      total: channels.length,
      success: successCount,
      failed: channels.length - successCount,
    };
  }

  // ──────────────────────────────────────────────
  //  IMPACTPOOL (international dev jobs)
  // ──────────────────────────────────────────────
  async scrapeImpactpool() {
    console.log("  → Impactpool...");
    let count = 0;
    try {
      const url = "https://www.impactpool.org/jobs?q=somalia";
      const { data } = await this.fetchWithRetry(url);
      const $ = cheerio.load(data);

      $('a[href*="/jobs/"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        if (!href.match(/\/jobs\/\d+/)) return;

        const fullText = $(el).text().trim();
        if (fullText.length < 5) return;

        const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
        const title = lines[0] || "";
        if (!title || title.length < 5) return;

        const company = lines[1] || "";
        const locationLine = lines.find((l) =>
          l.match(/remote|somalia|mogadishu|nairobi|stockholm|london|new york/i)
        );

        const jobUrl = href.startsWith("http")
          ? href
          : `https://www.impactpool.org${href}`;

        this.addJob({
          title: title.slice(0, 150),
          url: jobUrl,
          original_url: jobUrl,
          company: company.slice(0, 100) || "Impact Employer",
          location: this.extractLocation(title + " " + (locationLine || "")),
          type: this.extractType(title),
          source: "Impactpool",
          description: fullText.slice(0, 300),
          date_posted: "Recent",
        });
        count++;
      });
      this.stats.impactpool = count;
      console.log(`    Fetched ${count} jobs from Impactpool`);
    } catch (e) {
      console.log(`    ✗ Impactpool failed: ${e.message}`);
      this.failedChannels.push("impactpool");
    }
    return count;
  }

  // ──────────────────────────────────────────────
  //  SHAQOHEL (Somali job board)
  // ──────────────────────────────────────────────
  async scrapeShaqohel() {
    console.log("  → ShaqoHel...");
    let count = 0;
    try {
      const url = "https://shaqohel.com";
      const { data } = await this.fetchWithRetry(url);
      const $ = cheerio.load(data);

      $("article, .job-card, .post, [class*='job'], [class*='listing']").each((_, el) => {
        const titleEl = $(el).find("h2, h3, .entry-title, [class*='title']").first();
        const linkEl = $(el).find("a").first();
        const contentEl = $(el).find(".entry-content, .excerpt, p").first();

        const title = titleEl.text().trim();
        if (!title || title.length < 3) return;

        const href = linkEl.attr("href") || "";
        const jobUrl = href.startsWith("http") ? href : `https://shaqohel.com${href}`;
        const desc = contentEl.text().trim().slice(0, 300);

        this.addJob({
          title,
          url: jobUrl,
          original_url: jobUrl,
          company: "ShaqoHel",
          location: this.extractLocation(title + " " + desc),
          type: this.extractType(title + " " + desc),
          source: "ShaqoHel",
          description: desc,
          date_posted: "Recent",
        });
        count++;
      });
      this.stats.shaqohel = count;
      console.log(`    Fetched ${count} jobs from ShaqoHel`);
    } catch (e) {
      console.log(`    ✗ ShaqoHel failed: ${e.message}`);
      this.failedChannels.push("shaqohel");
    }
    return count;
  }

  // ──────────────────────────────────────────────
  //  JOBLINK.SO (Somali job board)
  // ──────────────────────────────────────────────
  async scrapeJoblink() {
    console.log("  → Joblink.so...");
    let count = 0;
    try {
      const url = "https://joblink.so";
      const { data } = await this.fetchWithRetry(url);
      const $ = cheerio.load(data);

      $("article, .job-card, .listing, [class*='job'], [class*='vacancy']").each((_, el) => {
        const titleEl = $(el).find("h2, h3, [class*='title']").first();
        const linkEl = $(el).find("a").first();
        const contentEl = $(el).find("p, .description, .excerpt").first();

        const title = titleEl.text().trim();
        if (!title || title.length < 3) return;

        const href = linkEl.attr("href") || "";
        const jobUrl = href.startsWith("http") ? href : `https://joblink.so${href}`;
        const desc = contentEl.text().trim().slice(0, 300);

        this.addJob({
          title,
          url: jobUrl,
          original_url: jobUrl,
          company: "Joblink.so",
          location: this.extractLocation(title + " " + desc),
          type: this.extractType(title + " " + desc),
          source: "Joblink.so",
          description: desc,
          date_posted: "Recent",
        });
        count++;
      });
      this.stats.joblink = count;
      console.log(`    Fetched ${count} jobs from Joblink.so`);
    } catch (e) {
      console.log(`    ✗ Joblink.so failed: ${e.message}`);
      this.failedChannels.push("joblink");
    }
    return count;
  }

  // ──────────────────────────────────────────────
  //  PRUNE & SAVE
  // ──────────────────────────────────────────────
  pruneExpiredJobs() {
    if (EXPIRY_MS === Infinity) {
      console.log("  ⏭  Expiry disabled (TIME_FILTER=all)");
      return 0;
    }
    const now = Date.now();
    const before = this.jobs.length;
    this.jobs = this.jobs.filter((job) => {
      if (!job.date_posted || job.date_posted === "Recent") return true;
      try {
        const jobDate = new Date(job.date_posted);
        if (isNaN(jobDate.getTime())) return true;
        return now - jobDate.getTime() <= EXPIRY_MS;
      } catch {
        return true;
      }
    });
    const removed = before - this.jobs.length;
    if (removed > 0) {
      console.log(`  🗑  Pruned ${removed} expired jobs (>${process.env.TIME_FILTER || "30d"} old)`);
    }
    return removed;
  }

  saveJson() {
    const dir = path.dirname(JOBS_JSON);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JOBS_JSON, JSON.stringify(this.jobs, null, 2), "utf-8");
    console.log(`\n✓ Written ${this.jobs.length} jobs to ${JOBS_JSON}`);
  }

  // ──────────────────────────────────────────────
  //  RUN ALL
  // ──────────────────────────────────────────────
  async runAll() {
    console.log("=".repeat(50));
    console.log("Somalia Job Scraper — starting");
    console.log(`  Time filter: ${process.env.TIME_FILTER || "30d"}`);
    console.log("=".repeat(50) + "\n");

    this.loadExistingJobs();
    const beforeCount = this.jobs.length;

    console.log("--- Telegram Channels ---");
    const tgResult = await this.scrapeTelegram();

    console.log("\n--- Job Boards ---");
    await this.scrapeImpactpool();
    await this.scrapeShaqohel();
    await this.scrapeJoblink();

    const newJobs = this.jobs.length - beforeCount;
    console.log(`\n  Summary:`);
    console.log(`    Telegram:   ${this.stats.telegram} jobs (${tgResult.success}/${tgResult.total} channels OK)`);
    console.log(`    Impactpool: ${this.stats.impactpool} jobs`);
    console.log(`    ShaqoHel:   ${this.stats.shaqohel} jobs`);
    console.log(`    Joblink:    ${this.stats.joblink} jobs`);
    console.log(`    New jobs this run: ${newJobs}`);

    if (this.failedChannels.length > 0) {
      console.log(`  ⚠ Failed sources: ${this.failedChannels.join(", ")}`);
    }

    this.pruneExpiredJobs();
    this.saveJson();
    console.log("\n✓ Done");
    return { total: this.jobs.length, stats: this.stats };
  }
}

async function main() {
  const scraper = new JobsScraper();
  await scraper.runAll();
}

if (require.main === module) main();
module.exports = JobsScraper;
