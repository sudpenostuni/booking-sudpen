import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/planner", async (req, res) => {
    try {
      const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwIi0UlydW3n1AsdY6vy9WKYOt12O68QwnxACwkra7-/exec?action=GET_ALL';
      
      // Google Apps Script often requires a User-Agent to return proper responses
      const response = await fetch(WEBHOOK_URL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Cache-Control": "no-cache"
        },
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Script: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("Failed to parse JSON. Response start:", text.substring(0, 200));
        // If it's HTML, it's likely an auth page or error page
        if (text.trim().startsWith("<")) {
            if (text.includes("accounts.google.com") || text.includes("signin")) {
                 res.status(502).json({ 
                    error: "Google Script requires authentication.", 
                    details: "Please redeploy your Google Apps Script with 'Who has access' set to 'Anyone'. Currently it redirects to a login page." 
                 });
            } else {
                 res.status(502).json({ error: "Received HTML instead of JSON.", details: text.substring(0, 100) });
            }
        } else {
            res.status(500).json({ error: "Invalid JSON response from Google Script" });
        }
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch planner data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
