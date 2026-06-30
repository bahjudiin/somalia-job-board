import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

async function startServer() {
  const app = express();
  const server = createServer(app);

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  const jobsJsonPath = path.resolve(PROJECT_ROOT, "client", "public", "jobs.json");

  app.get("/api/jobs", (_req, res) => {
    try {
      if (fs.existsSync(jobsJsonPath)) {
        const data = fs.readFileSync(jobsJsonPath, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.json([]);
      }
    } catch {
      res.status(500).json({ error: "Failed to read jobs data" });
    }
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
