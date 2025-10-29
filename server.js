const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

// 🧠 Scroll Helper Function
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 800;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

// 🕷 Main endpoint
app.post('/run', async (req, res) => {
  const { url, action = 'title', depth = 1 } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_BIN || puppeteer.executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-zygote'
      ],
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await autoScroll(page);

    let result;

    // 🧩 Extract emails from main page
    if (action === 'emails') {
      const emailsFound = new Set();
      const visited = new Set();
      const toVisit = [url];
      const origin = new URL(url).origin;

      while (toVisit.length > 0 && visited.size < 10) { // limit 10 pages to avoid overload
        const currentUrl = toVisit.pop();
        if (visited.has(currentUrl)) continue;

        try {
          await page.goto(currentUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await autoScroll(page);

          const html = await page.content();
          const newEmails = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
          newEmails.forEach(e => emailsFound.add(e.toLowerCase()));

          // 🕸 Find internal links for deeper crawl
          const links = await page.$$eval('a[href]', anchors =>
            anchors.map(a => a.href).filter(h => h.startsWith(location.origin))
          );
          links.forEach(l => {
            if (!visited.has(l) && toVisit.length < 20) toVisit.push(l);
          });

          visited.add(currentUrl);
        } catch (err) {
          console.error(`❌ Failed on ${currentUrl}: ${err.message}`);
        }
      }

      result = [...emailsFound];
    }

    // 🖼 Screenshot action
    else if (action === 'screenshot') {
      await page.screenshot({ path: 'output.png', fullPage: true });
      result = 'Screenshot saved as output.png';
    }

    // 🧱 Raw HTML extraction
    else if (action === 'html') {
      result = await page.content();
    }

    // 🏷 Default: just the title
    else {
      result = await page.title();
    }

    res.json({ result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
