import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, 'dist');

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  PLAYWRIGHT EXTENSION TEST SUITE       ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Launch with extension
  const context = await chromium.launchPersistentContext(
    path.join(__dirname, '.test-profile'),
    {
      headless: false,  // Extensions need headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-gpu',
      ],
    }
  );

  try {
    console.log('📦 Extension loaded from:', extensionPath);
    console.log('👁️  Running in HEADED mode (no headless)\n');

    // Get extension ID
    const page = await context.newPage();
    await page.goto('about:blank');
    
    let extensionId = 'unknown';
    try {
      extensionId = await page.evaluate(() => chrome.runtime.id);
    } catch (e) {
      console.log('⚠️  Could not get extension ID, will use manual URL\n');
    }

    // Test 1: Load dashboard directly
    console.log('TEST 1️⃣: Loading dashboard...');
    const dashboardUrl = `chrome-extension://${extensionId}/dist/dashboard.html`;
    console.log(`URL: ${dashboardUrl}`);
    
    await page.goto(dashboardUrl);
    const title = await page.title();
    console.log(`✅ Dashboard loaded: "${title}"\n`);

    // Test 2: Check initial state
    console.log('TEST 2️⃣: Checking initial state...');
    const hasContainer = await page.locator('#components-container').isVisible();
    const hasEmptyState = await page.locator('.empty-state').isVisible();
    console.log(`${hasContainer ? '✅' : '❌'} Container visible: ${hasContainer}`);
    console.log(`${hasEmptyState ? '✅' : '❌'} Empty state visible: ${hasEmptyState}\n`);

    // Test 3: Add test component via chrome.storage
    console.log('TEST 3️⃣: Adding test component via chrome.storage.local...');
    const testComponent = {
      id: 'test-bbc-1',
      url: 'https://bbc.com/news/world',
      name: 'BBC Top Stories',
      selector: 'div[data-testid="most-read"]',
      html_cache: '<div class="top-stories"><h2>Top Stories</h2><article><h3>Breaking News Article 1</h3></article><article><h3>Breaking News Article 2</h3></article></div>',
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, testComponent);

    console.log('✅ Component added to chrome.storage.local\n');

    // Test 4: Reload and check rendering
    console.log('TEST 4️⃣: Reloading to render component...');
    await page.reload({ waitUntil: 'load' });
    
    const cardExists = await page.locator('.component-card').isVisible();
    console.log(`${cardExists ? '✅' : '❌'} Component card rendered: ${cardExists}`);
    
    if (cardExists) {
      const cardTitle = await page.locator('.component-card h3').textContent();
      const cardUrl = await page.locator('.component-card small').textContent();
      console.log(`📄 Title: "${cardTitle}"`);
      console.log(`🔗 URL: "${cardUrl}"\n`);
    } else {
      console.log('❌ Card failed to render\n');
    }

    // Test 5: Check cursor styling
    console.log('TEST 5️⃣: Testing CURSOR BEHAVIOR...');
    const card = page.locator('.component-card');
    
    if (await card.isVisible()) {
      const inlineStyle = await card.evaluate(el => el.style.cursor);
      console.log(`  Inline style: "${inlineStyle}"`);
      
      // Get computed before hover
      const cursorBefore = await card.evaluate(el => window.getComputedStyle(el).cursor);
      console.log(`  Computed BEFORE hover: "${cursorBefore}"`);
      
      // Hover over card
      await card.hover();
      await page.waitForTimeout(300);
      
      // Get computed after hover
      const cursorAfter = await card.evaluate(el => window.getComputedStyle(el).cursor);
      console.log(`  Computed AFTER hover: "${cursorAfter}"`);
      
      const isPointer = cursorAfter === 'pointer';
      console.log(`${isPointer ? '✅' : '❌'} Cursor changes to pointer: ${isPointer}\n`);
    }

    // Test 6: Test click behavior
    console.log('TEST 6️⃣: Testing CLICK BEHAVIOR...');
    
    if (await card.isVisible()) {
      // Set up listener for popup
      let popupDetected = false;
      const popupPromise = page.context().once('page', () => {
        popupDetected = true;
      });

      // Click the card
      console.log('  Clicking card...');
      await card.click();
      
      // Wait for popup with timeout
      await Promise.race([
        popupPromise,
        new Promise(r => setTimeout(r, 1000))
      ]);
      
      console.log(`${popupDetected ? '✅' : '❌'} Popup/new window opened: ${popupDetected}\n`);
    }

    // Test 7: Multiple components
    console.log('TEST 7️⃣: Testing with MULTIPLE COMPONENTS...');
    const components = [
      {
        id: 'bbc-1',
        url: 'https://bbc.com/news',
        name: 'BBC - Most Read',
        html_cache: '<div>BBC Content</div>',
        last_updated: new Date().toISOString(),
      },
      {
        id: 'deals-1',
        url: 'https://hotukdeals.com',
        name: 'Hot UK Deals - Today',
        html_cache: '<div>Deals Content</div>',
        last_updated: new Date().toISOString(),
      },
      {
        id: 'tech-1',
        url: 'https://techcrunch.com',
        name: 'TechCrunch - Hot',
        html_cache: '<div>Tech Content</div>',
        last_updated: new Date().toISOString(),
      },
    ];

    await page.evaluate((comps) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: comps }, resolve);
      });
    }, components);

    await page.reload({ waitUntil: 'load' });
    const cardCount = await page.locator('.component-card').count();
    console.log(`${cardCount === 3 ? '✅' : '❌'} All 3 cards rendered: ${cardCount}/3`);
    
    if (cardCount === 3) {
      const cards = await page.locator('.component-card').all();
      for (let i = 0; i < cards.length; i++) {
        const title = await cards[i].locator('h3').textContent();
        const url = await cards[i].locator('small').textContent();
        const cursor = await cards[i].evaluate(el => window.getComputedStyle(el).cursor);
        console.log(`  Card ${i + 1}: "${title}" | Cursor: ${cursor}`);
      }
    }
    console.log();

    // Test 8: Console output
    console.log('TEST 8️⃣: Checking console for errors...');
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1000);
    
    const errors = consoleLogs.filter(l => l.type === 'error');
    const warnings = consoleLogs.filter(l => l.type === 'warning');
    const logs = consoleLogs.filter(l => l.type === 'log');
    
    console.log(`  Logs: ${logs.length} | Warnings: ${warnings.length} | Errors: ${errors.length}`);
    
    if (logs.length > 0) {
      console.log('\n  📋 Log messages:');
      logs.slice(0, 5).forEach(l => console.log(`     - ${l.text}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n  ⚠️  Warnings:');
      warnings.slice(0, 3).forEach(w => console.log(`     - ${w.text}`));
    }
    
    if (errors.length > 0) {
      console.log('\n  ❌ Errors:');
      errors.forEach(e => console.log(`     - ${e.text}`));
    }
    console.log();

    // Test 9: DOM structure inspection
    console.log('TEST 9️⃣: DOM Structure Analysis...');
    const cardDOM = await page.locator('.component-card').first().evaluate(el => {
      return {
        tag: el.tagName,
        className: el.className,
        id: el.id || 'none',
        styles: {
          cursor: el.style.cursor,
          pointerEvents: el.style.pointerEvents,
          userSelect: el.style.userSelect,
        },
        attributes: Array.from(el.attributes).map(a => `${a.name}="${a.value}"`),
        children: el.children.length,
      };
    });
    
    console.log('Card element structure:');
    console.log(JSON.stringify(cardDOM, null, 2));
    console.log();

    // Summary
    console.log('╔════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                          ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('✅ Dashboard loads correctly');
    console.log(`${cardExists ? '✅' : '❌'} Components render in grid`);
    console.log(`${cursorAfter === 'pointer' ? '✅' : '❌'} Cursor shows as pointer`);
    console.log(`${popupDetected ? '✅' : '❌'} Click opens new window`);
    console.log(`${cardCount === 3 ? '✅' : '❌'} Multiple components work`);
    console.log(`${errors.length === 0 ? '✅' : '❌'} No console errors\n`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    console.log('⏳ Keeping browser open for 5 seconds...\n');
    await new Promise(r => setTimeout(r, 5000));
    await context.close();
    console.log('✅ Tests complete, browser closed\n');
  }
}

runTests().catch(console.error);