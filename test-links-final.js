import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('\n📋 TESTING COMPONENT CANVAS LINKS\n');
  console.log('Opening browser with Playwright (headless disabled)\n');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Mock chrome API since we're testing the dashboard logic standalone
    await page.addInitScript(() => {
      window.chrome = {
        storage: {
          local: {
            get: (keys, callback) => {
              const stored = localStorage.getItem('components');
              callback({ components: stored ? JSON.parse(stored) : [] });
            },
            set: (data, callback) => {
              if (data.components) {
                localStorage.setItem('components', JSON.stringify(data.components));
              }
              if (callback) callback();
            }
          }
        },
        runtime: {
          getURL: (path) => path
        }
      };
    });

    // Load dashboard
    const dashboardPath = `file://${path.join(__dirname, 'dist', 'dashboard.html')}`;
    console.log(`Loading dashboard from: ${dashboardPath}\n`);
    
    await page.goto(dashboardPath, { waitUntil: 'load' });
    console.log('✅ Dashboard loaded\n');

    // Setup console logging
    page.on('console', msg => {
      console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // ========== TEST 1: EXTERNAL LINK ==========
    console.log('========== TEST 1: EXTERNAL LINK ==========\n');
    
    const comp1 = {
      id: 'test-1',
      url: 'https://bbc.com/news',
      name: 'BBC News - Most Read',
      html_cache: `
        <div class="article-list">
          <h2>Top Stories</h2>
          <a href="https://bbc.com/news/articles/12345">Breaking: Major News Story</a>
          <p>Published today</p>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    // Set component in storage
    await page.evaluate((comp) => {
      localStorage.setItem('components', JSON.stringify([comp]));
    }, comp1);

    // Reload to display
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const link1 = page.locator('.component-card a[href^="https"]');
    const link1Exists = await link1.isVisible().catch(() => false);
    
    console.log(`External link visible: ${link1Exists}`);
    if (link1Exists) {
      const text = await link1.textContent();
      const href = await link1.getAttribute('href');
      console.log(`Link text: "${text}"`);
      console.log(`Link href: "${href}"`);
      
      // Try clicking
      console.log('\n🔗 Attempting to click external link...');
      let newTabOpened = false;
      
      const pageHandler = (newPage) => {
        newTabOpened = true;
        console.log(`✅ NEW TAB OPENED: ${newPage.url()}`);
        newPage.close();
      };
      
      context.on('page', pageHandler);
      
      try {
        await link1.click();
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`❌ Click failed: ${e.message}`);
      }
      
      context.off('page', pageHandler);
      console.log(`Tab opened on click: ${newTabOpened}`);
    }
    console.log();

    // ========== TEST 2: HASH LINK ==========
    console.log('========== TEST 2: HASH/ANCHOR LINK ==========\n');
    
    const comp2 = {
      id: 'test-2',
      url: 'https://bbc.com',
      name: 'Hash Link Test',
      html_cache: `
        <div>
          <h3>Jump Links</h3>
          <a href="#section-2">Jump to Section 2</a>
          <hr/>
          <div id="section-2">
            <h4>Section 2 Content</h4>
            <p>You jumped here!</p>
          </div>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      localStorage.setItem('components', JSON.stringify([comp]));
    }, comp2);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const link2 = page.locator('.component-card a[href^="#"]');
    const link2Exists = await link2.isVisible().catch(() => false);
    
    console.log(`Hash link visible: ${link2Exists}`);
    if (link2Exists) {
      const href = await link2.getAttribute('href');
      console.log(`Hash link href: "${href}"`);
      
      console.log('\n🔗 Clicking hash link...');
      try {
        await link2.click();
        await page.waitForTimeout(500);
        console.log('✅ Hash link clicked');
      } catch (e) {
        console.log(`❌ Click failed: ${e.message}`);
      }
    }
    console.log();

    // ========== TEST 3: INLINE ONCLICK ==========
    console.log('========== TEST 3: BUTTON WITH INLINE ONCLICK ==========\n');
    
    const comp3 = {
      id: 'test-3',
      url: 'https://bbc.com',
      name: 'Button Test',
      html_cache: `
        <div>
          <button onclick="console.log('Button clicked! Alert would show here.')">Click Button</button>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      localStorage.setItem('components', JSON.stringify([comp]));
    }, comp3);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const btn = page.locator('.component-card button');
    const btnExists = await btn.isVisible().catch(() => false);
    
    console.log(`Button visible: ${btnExists}`);
    if (btnExists) {
      const text = await btn.textContent();
      console.log(`Button text: "${text}"`);
      
      console.log('\n🔘 Clicking button...');
      try {
        await btn.click();
        await page.waitForTimeout(500);
        console.log('✅ Button clicked (check console above for onclick output)');
      } catch (e) {
        console.log(`❌ Click failed: ${e.message}`);
      }
    }
    console.log();

    // ========== TEST 4: MULTIPLE LINK TYPES ==========
    console.log('========== TEST 4: MIXED LINK TYPES ==========\n');
    
    const comp4 = {
      id: 'test-4',
      url: 'https://hotukdeals.com',
      name: 'Mixed Links Test',
      html_cache: `
        <div class="deal-item">
          <h3>Hot Deal Today</h3>
          <a href="https://amazon.com/deal123">View on Amazon</a>
          <a href="#details">See Details Below</a>
          <button onclick="console.log('Save deal!')">Save Deal</button>
          <div id="details" style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
            <h4>Deal Details</h4>
            <p>Price: £9.99</p>
            <p>Discount: 50%</p>
          </div>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      localStorage.setItem('components', JSON.stringify([comp]));
    }, comp4);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const allLinks = await page.locator('.component-card a').all();
    const allButtons = await page.locator('.component-card button').all();
    
    console.log(`Found ${allLinks.length} links and ${allButtons.length} buttons\n`);
    
    for (let i = 0; i < allLinks.length; i++) {
      const href = await allLinks[i].getAttribute('href');
      const text = await allLinks[i].textContent();
      console.log(`Link ${i + 1}: "${text}"`);
      console.log(`  → href: "${href}"`);
    }
    
    if (allButtons.length > 0) {
      console.log(`\nButton: "${await allButtons[0].textContent()}"`);
    }
    console.log();

    // ========== SUMMARY ==========
    console.log('========== OBSERVATIONS ==========\n');
    console.log('✅ Dashboard loads successfully');
    console.log(`✅ Components render: ${link1Exists || link2Exists}`);
    console.log(`✅ Links are present in HTML: ${allLinks.length > 0}`);
    console.log(`⚠️  Test interactions above - click links manually if needed\n`);

    console.log('📌 OPEN DEVTOOLS (F12) IN THE BROWSER WINDOW TO:');
    console.log('   1. Check Console tab for errors/warnings');
    console.log('   2. Look for "CSP" or "Refused to execute" errors');
    console.log('   3. Check if onclick handlers fire\n');
    
    console.log('⏳ Browser will stay open for 30 seconds for manual testing...\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await context.close();
    await browser.close();
  }
}

test();
