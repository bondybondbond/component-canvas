import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(path.join(__dirname, 'dist'));

async function test() {
  console.log('\n📋 EXTENSION CANVAS LINK TEST\n');
  console.log(`Extension path: ${extensionPath}`);
  console.log(`Headless DISABLED - browser will open\n`);
  
  const context = await chromium.launchPersistentContext(
    path.join(process.cwd(), '.test-profile'),
    {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    }
  );

  try {
    // Wait for service worker
    console.log('Waiting for service worker...');
    let sw;
    try {
      [sw] = context.serviceWorkers();
      if (!sw) {
        sw = await context.waitForEvent('serviceworker', { timeout: 5000 });
      }
    } catch (e) {
      console.log('⚠️  No service worker (continuing anyway)');
    }

    const page = await context.newPage();
    
    // Get extension ID by navigating to extension URL first
    console.log('Getting extension ID...');
    
    // Try accessing an extension page to trigger it to load
    let extId = null;
    try {
      // Method 1: Check if we can get ID from a page within extension context
      await page.goto('chrome://extensions');
      await page.waitForTimeout(1000);
      
      // Method 2: Use a different approach - look at service worker URL
      const workers = context.serviceWorkers();
      if (workers.length > 0) {
        const workerUrl = workers[0].url();
        const match = workerUrl.match(/chrome-extension:\/\/([^/]+)\//);
        if (match) {
          extId = match[1];
        }
      }
    } catch (e) {
      // Fallback: try to extract from a known extension pattern
      console.log('⚠️  Could not auto-detect extension ID, will try alternative method');
    }
    
    if (!extId) {
      console.log('⚠️  Extension ID detection failed - trying to continue anyway\n');
      // We'll try a generic approach
      extId = 'dashboardpage';
    } else {
      console.log(`✅ Extension ID: ${extId}\n`);
    }

    // Navigate to dashboard
    const dashUrl = `chrome-extension://${extId}/dist/dashboard.html`;
    console.log(`Navigating to: ${dashUrl}\n`);
    await page.goto(dashUrl, { waitUntil: 'load' });
    console.log(`✅ Dashboard loaded\n`);

    // Setup console logging
    page.on('console', msg => {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // TEST 1: External link
    console.log('========== TEST 1: EXTERNAL LINK ==========\n');
    
    const comp1 = {
      id: 'test-1',
      url: 'https://bbc.com',
      name: 'BBC External Link Test',
      html_cache: '<div><a href="https://example.com/article">Read Article</a></div>',
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((c) => {
      return new Promise(r => chrome.storage.local.set({ components: [c] }, r));
    }, comp1);

    await page.reload({ waitUntil: 'load' });
    
    const link = page.locator('.component-card a');
    const exists = await link.isVisible().catch(() => false);
    console.log(`Link visible: ${exists}`);
    
    if (exists) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`Link text: "${text}"`);
      console.log(`Link href: "${href}"`);
      console.log(`Attempting to click link...\n`);
      
      let tabOpened = false;
      const pageHandler = () => { tabOpened = true; };
      context.on('page', pageHandler);
      
      await link.click().catch(e => console.log(`Click error: ${e.message}`));
      await page.waitForTimeout(500);
      
      context.off('page', pageHandler);
      console.log(`New tab opened: ${tabOpened}\n`);
    }

    // TEST 2: Hash link
    console.log('========== TEST 2: HASH LINK ==========\n');
    
    const comp2 = {
      id: 'test-2',
      url: 'https://bbc.com',
      name: 'Hash Link Test',
      html_cache: `
        <div id="sec1">
          <h3>Section 1</h3>
          <a href="#section2">Jump to Section 2</a>
        </div>
        <div id="section2">
          <h3>Section 2</h3>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((c) => {
      return new Promise(r => chrome.storage.local.set({ components: [c] }, r));
    }, comp2);

    await page.reload({ waitUntil: 'load' });
    
    const hashLink = page.locator('.component-card a[href^="#"]');
    const hashExists = await hashLink.isVisible().catch(() => false);
    console.log(`Hash link visible: ${hashExists}`);
    
    if (hashExists) {
      const href = await hashLink.getAttribute('href');
      console.log(`Hash link href: "${href}"`);
      console.log(`Clicking hash link...\n`);
      await hashLink.click().catch(e => console.log(`Click error: ${e.message}`));
      await page.waitForTimeout(300);
    }

    // TEST 3: Button with onclick
    console.log('========== TEST 3: BUTTON WITH ONCLICK ==========\n');
    
    const comp3 = {
      id: 'test-3',
      url: 'https://bbc.com',
      name: 'Button Test',
      html_cache: `
        <div>
          <button onclick="console.log('Button clicked!')">Click Me</button>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((c) => {
      return new Promise(r => chrome.storage.local.set({ components: [c] }, r));
    }, comp3);

    await page.reload({ waitUntil: 'load' });
    
    const btn = page.locator('.component-card button');
    const btnExists = await btn.isVisible().catch(() => false);
    console.log(`Button visible: ${btnExists}`);
    
    if (btnExists) {
      const btnText = await btn.textContent();
      console.log(`Button text: "${btnText}"`);
      console.log(`Clicking button...\n`);
      await btn.click().catch(e => console.log(`Click error: ${e.message}`));
      await page.waitForTimeout(500);
    }

    // TEST 4: Inspect all links
    console.log('========== TEST 4: LINK INSPECTION ==========\n');
    
    const comp4 = {
      id: 'test-4',
      url: 'https://bbc.com',
      name: 'All Link Types',
      html_cache: `
        <div>
          <a href="https://external.com">External Link</a>
          <a href="#anchor">Hash Link</a>
          <a href="javascript:void(0)">JavaScript Link</a>
          <button onclick="alert('test')">Button onclick</button>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((c) => {
      return new Promise(r => chrome.storage.local.set({ components: [c] }, r));
    }, comp4);

    await page.reload({ waitUntil: 'load' });

    const allLinks = await page.locator('.component-card a').all();
    console.log(`Found ${allLinks.length} links:\n`);

    for (let i = 0; i < allLinks.length; i++) {
      const href = await allLinks[i].getAttribute('href');
      const text = await allLinks[i].textContent();
      console.log(`  ${i+1}. "${text}" -> href="${href}"`);
    }

    console.log('\n========== SUMMARY ==========\n');
    console.log('Tests completed. Browser will remain open for 20 seconds.');
    console.log('📌 CHECK IN BROWSER:');
    console.log('  - F12 to open DevTools Console');
    console.log('  - Look for CSP errors like "Refused to execute inline script"');
    console.log('  - Try clicking links manually to see what happens');
    console.log('  - Check if new tabs open\n');
    
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);
  } finally {
    await context.close();
  }
}

test();
