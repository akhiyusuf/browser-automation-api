const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/run', async (req, res) => {
  const { url, action = 'title' } = req.body;
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
    // Smart Scroll Helper
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

// Scroll the page to ensure all elements load
await autoScroll(page);


    let result;
    let result;

if (action === 'emails') {
  const html = await page.content();
  const emails = [...new Set(
    html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
  )];
  result = emails;
} else if (action === 'screenshot') {
  await page.screenshot({ path: 'output.png', fullPage: true });
  result = 'screenshot saved';
} else if (action === 'html') {
  result = await page.content();
} else {
  result = await page.title();
}
 else if (action === 'html') {
      result = await page.content();
    } else {
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
app.listen(port, () => console.log(`Server running on port ${port}`));
