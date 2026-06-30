#!/usr/bin/env node
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const JOBS_JSON = path.join(__dirname, "..", "client", "public", "jobs.json");
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

    const datePosted = job.date_posted || "Recent";
    if (datePosted !== "Recent") {
      const jobDate = new Date(datePosted);
      if (Date.now() - jobDate.getTime() > THIRTY_DAYS_MS) return;
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
      "Amal Bank", "Salaam Bank", "Zaad", "Telesom"
    ];
    for (const org of orgs) {
      if (text.includes(org)) return org;
    }
    const companyMatch = text.match(/(?:Company|Organization|Hay.ad|Shirkad|Employer)[:\s]+([^\n,]+)/i);
    return companyMatch ? companyMatch[1].trim().slice(0, 80) : "Somali Employer";
  }

  extractOriginalUrl(text) {
    const sites = [
      "somalijobs.com", "shaqohel.com", "qaranjobs.com", "joblink.so",
      "somalijobs.net", "goobjoog.com", "masterjobsafrica.com",
      "reliefweb.int", "impactpool.org", "devjobsscanner.com"
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

  async scrapeTelegramChannel(channel) {
    console.log(`  → Telegram @${channel}...`);
    let totalFetched = 0;
    let before = "";

    for (let page = 0; page < 4; page++) {
      try {
        const url = before
          ? `https://t.me/s/${channel}?before=${before}`
          : `https://t.me/s/${channel}`;
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

          const isJob = text.match(/fursad|shaqo|vacancy|hiring|job|career|opportunity|boos|jagad|deadline|macalin|teacher|engineer|nurse|doctor|manager|director|officer|coordinator|specialist|analyst|assistant|intern/i);
          if (!isJob) return;

          const title = this.cleanTitle(text.split("\n").find(l =>
            l.match(/booska|jagada|title|position|vacancy|hiring|fursad|macalin|teacher|engineer|nurse|doctor|manager|director|officer|coordinator|specialist/i)
          ) || text.split("\n")[0] || "Job Opportunity");

          const originalUrl = this.extractOriginalUrl(text);
          const location = this.extractLocation(text);
          const type = this.extractType(text);
          const company = this.extractCompany(text);
          const cleanText = text.replace(/https?:\/\/\S+/g, "").replace(/#\w+/g, "").trim();

          this.addJob({
            title: title.slice(0, 150),
            url: originalUrl || msgUrl,
            original_url: originalUrl,
            company,
            location,
            type,
            source: `@${channel}`,
            description: cleanText.slice(0, 300),
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
    const channels = [
      "somalijobsinc",
      "shaqohel",
      "somalijobsweb",
      "Somalijobs24",
      "Ethiosomalijobs"
    ];
    for (const ch of channels) {
      await this.scrapeTelegramChannel(ch);
    }
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

    console.log("--- Telegram Channels ---");
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
