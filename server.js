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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    let result;
    if (action === 'screenshot') {
      await page.screenshot({ path: 'output.png', fullPage: true });
      result = 'screenshot saved';
    } else if (action === 'html') {
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
