import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_ID = 'fjfehoaijfgbojpfahmoejnnnamdklkp';
const DASHBOARD_URL = `chrome-extension://${EXTENSION_ID}/dashboard.html`;

async function test() {
  console.log('\n📋 TESTING COMPONENT CANVAS LINKS IN EXTENSION\n');
  console.log(`Dashboard URL: ${DASHBOARD_URL}\n`);
  console.log('Opening browser with extension loaded (headless disabled)...\n');
  
  const extensionPath = path.resolve(path.join(__dirname, 'dist'));
  
  const context = await chromium.launchPersistentContext(
    path.join(__dirname, '.test-profile-extension'),
    {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    }
  );

  try {
    const page = await context.newPage();

    // Setup console logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // Navigate to dashboard
    console.log('Loading dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'load' });
    console.log('✅ Dashboard loaded\n');

    // ========== TEST 1: EXTERNAL LINK FROM BBC ==========
    console.log('========== TEST 1: EXTERNAL LINK (BBC Article) ==========\n');
    
    const comp1 = {
      id: 'test-bbc',
      url: 'https://bbc.com/news',
      name: 'BBC News - Most Read',
      html_cache: `
        <div class="most-read">
          <h3>📰 Top Stories</h3>
          <a href="https://bbc.com/news/articles/c0000000">Breaking: Major Event Happens</a>
          <p>1 hour ago</p>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    // Inject via extension storage API
    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, comp1);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const link1 = page.locator('.component-card a[href^="https"]').first();
    const link1Visible = await link1.isVisible().catch(() => false);
    
    console.log(`✓ Link visible: ${link1Visible}`);
    
    if (link1Visible) {
      const text = await link1.textContent();
      const href = await link1.getAttribute('href');
      console.log(`✓ Link text: "${text}"`);
      console.log(`✓ Link href: "${href}"`);
      console.log(`\n→ Now clicking the external link...`);
      
      let newTabOpened = false;
      const pageHandler = (newPage) => {
        newTabOpened = true;
        const newUrl = newPage.url();
        console.log(`✅ NEW TAB OPENED: ${newUrl}`);
        newPage.close();
      };
      
      context.on('page', pageHandler);
      
      try {
        await link1.click();
        await page.waitForTimeout(1500);
      } catch (e) {
        console.log(`❌ Click error: ${e.message}`);
      }
      
      context.off('page', pageHandler);
      
      if (newTabOpened) {
        console.log(`✅ RESULT: New tab opened successfully`);
      } else {
        console.log(`❌ RESULT: Click did NOT open new tab`);
      }
    } else {
      console.log('❌ Link not visible - rendering issue');
    }
    console.log();

    // ========== TEST 2: HOTUKDEALS LINK ==========
    console.log('========== TEST 2: HOTUKDEALS EXTERNAL LINK ==========\n');
    
    const comp2 = {
      id: 'test-deals',
      url: 'https://hotukdeals.com',
      name: 'Hot UK Deals - Today\'s Hot',
      html_cache: `
        <div class="deal">
          <h3>🔥 Deal of the Day</h3>
          <a href="https://hotukdeals.com/deals/12345">50% Off Everything - Limited Time</a>
          <p>£9.99 (was £19.99)</p>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, comp2);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const link2 = page.locator('.component-card a[href^="https"]').first();
    const link2Visible = await link2.isVisible().catch(() => false);
    
    console.log(`✓ Link visible: ${link2Visible}`);
    
    if (link2Visible) {
      const text = await link2.textContent();
      const href = await link2.getAttribute('href');
      console.log(`✓ Link text: "${text}"`);
      console.log(`✓ Link href: "${href}"`);
      console.log(`\n→ Clicking the deal link...`);
      
      let newTabOpened = false;
      const pageHandler = () => { newTabOpened = true; };
      
      context.on('page', pageHandler);
      await link2.click().catch(() => {});
      await page.waitForTimeout(1500);
      context.off('page', pageHandler);
      
      console.log(`${newTabOpened ? '✅' : '❌'} RESULT: ${newTabOpened ? 'New tab opened' : 'No new tab'}`);
    }
    console.log();

    // ========== TEST 3: HASH LINK ==========
    console.log('========== TEST 3: HASH/ANCHOR LINK ==========\n');
    
    const comp3 = {
      id: 'test-hash',
      url: 'https://example.com',
      name: 'Hash Link Test',
      html_cache: `
        <div>
          <h3>Navigation Links</h3>
          <a href="#section-2">Jump to Section 2</a>
          <hr/>
          <div id="section-2">
            <h4>Section 2 Content</h4>
            <p>You scrolled here!</p>
          </div>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, comp3);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const hashLink = page.locator('.component-card a[href^="#"]').first();
    const hashVisible = await hashLink.isVisible().catch(() => false);
    
    console.log(`✓ Hash link visible: ${hashVisible}`);
    
    if (hashVisible) {
      const href = await hashLink.getAttribute('href');
      console.log(`✓ Hash link href: "${href}"`);
      console.log(`\n→ Clicking hash link...`);
      
      try {
        await hashLink.click();
        await page.waitForTimeout(500);
        console.log(`✅ RESULT: Hash link clicked (should scroll)`);
      } catch (e) {
        console.log(`❌ Click error: ${e.message}`);
      }
    }
    console.log();

    // ========== TEST 4: BUTTON WITH ONCLICK ==========
    console.log('========== TEST 4: BUTTON WITH ONCLICK ==========\n');
    
    const comp4 = {
      id: 'test-button',
      url: 'https://example.com',
      name: 'Button Test',
      html_cache: `
        <div>
          <h3>Interactive Elements</h3>
          <button onclick="console.log('Button was clicked! This message should appear in console above.')">Click Me</button>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, comp4);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const btn = page.locator('.component-card button').first();
    const btnVisible = await btn.isVisible().catch(() => false);
    
    console.log(`✓ Button visible: ${btnVisible}`);
    
    if (btnVisible) {
      const text = await btn.textContent();
      console.log(`✓ Button text: "${text}"`);
      console.log(`\n→ Clicking button...`);
      
      try {
        await btn.click();
        await page.waitForTimeout(500);
        console.log(`⚠️  RESULT: Button clicked (check console logs above for onclick handler)`);
      } catch (e) {
        console.log(`❌ Click error: ${e.message}`);
      }
    }
    console.log();

    // ========== TEST 5: MIXED COMPONENTS ==========
    console.log('========== TEST 5: ALL LINK TYPES TOGETHER ==========\n');
    
    const comp5 = {
      id: 'test-mixed',
      url: 'https://bbc.com',
      name: 'Mixed Elements',
      html_cache: `
        <div>
          <h3>Different Link Types</h3>
          <ul>
            <li><a href="https://google.com">External: Google</a></li>
            <li><a href="#bottom">Hash: Jump to bottom</a></li>
            <li><button onclick="console.log('Onclick test')">Button: Click test</button></li>
          </ul>
          <div id="bottom" style="margin-top: 50px;">Bottom content</div>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, comp5);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const allLinks = await page.locator('.component-card a').all();
    const allButtons = await page.locator('.component-card button').all();
    
    console.log(`✓ Found ${allLinks.length} links and ${allButtons.length} buttons\n`);
    
    console.log('Links in component:');
    for (let i = 0; i < allLinks.length; i++) {
      const href = await allLinks[i].getAttribute('href');
      const text = await allLinks[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
      console.log(`     → href="${href}"`);
    }
    
    if (allButtons.length > 0) {
      console.log(`\nButtons in component:`);
      const btnText = await allButtons[0].textContent();
      console.log(`  1. "${btnText}"`);
    }
    console.log();

    // ========== SUMMARY ==========
    console.log('\n========== SUMMARY & RECOMMENDATIONS ==========\n');
    console.log('✅ Dashboard loads from extension URL');
    console.log(`✅ Components render: ${allLinks.length > 0 || allButtons.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Links present: ${allLinks.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Buttons present: ${allButtons.length > 0 ? 'YES' : 'NO'}\n`);
    
    console.log('📌 MANUAL TESTING IN BROWSER:');
    console.log('  1. The browser window is still open');
    console.log('  2. Try clicking the links/buttons manually');
    console.log('  3. Open DevTools (F12) and check:');
    console.log('     - Console tab for onclick output');
    console.log('     - Check for CSP "Refused to execute" errors');
    console.log('     - Network tab to see if new requests are made\n');
    
    console.log('⏳ Browser will close in 40 seconds...\n');
    await page.waitForTimeout(40000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await context.close();
    console.log('\n✅ Test completed');
  }
}

test();
