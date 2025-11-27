import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext();

  try {
    console.log('\n========== DASHBOARD FUNCTIONAL TEST SUITE ==========\n');

    const page = await context.newPage();
    
    // Set up a mock chrome.storage
    await page.addInitScript(() => {
      window.chrome = window.chrome || {};
      window.chrome.storage = {
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
      };
      window.chrome.runtime = {
        getURL: (path) => path
      };
    });

    const dashboardPath = `file://${path.join(__dirname, 'dist', 'dashboard.html')}`;
    
    // Test 1️⃣: Load dashboard
    console.log('TEST 1️⃣: Loading dashboard...');
    await page.goto(dashboardPath);
    const title = await page.title();
    console.log(`✅ Dashboard loaded. Title: "${title}"`);

    // Test 2️⃣: Empty state
    console.log('\nTEST 2️⃣: Checking empty state...');
    const emptyVisible = await page.locator('.empty-state').isVisible();
    console.log(`${emptyVisible ? '✅' : '❌'} Empty state visible: ${emptyVisible}`);

    // Test 3️⃣: Add test component to storage
    console.log('\nTEST 3️⃣: Adding test component to localStorage...');
    const testComponent = {
      id: 'test-1',
      url: 'https://example.com',
      name: 'Test BBC Component',
      html_cache: '<div><h2>Top Stories</h2><p>Lorem ipsum dolor</p></div>',
      last_updated: new Date().toISOString(),
    };
    
    await page.evaluate((comp) => {
      localStorage.setItem('components', JSON.stringify([comp]));
    }, testComponent);
    console.log('✅ Test component added to localStorage');

    // Test 4️⃣: Reload to see component render
    console.log('\nTEST 4️⃣: Reloading dashboard to render component...');
    await page.reload();
    const cardVisible = await page.locator('.component-card').isVisible();
    console.log(`${cardVisible ? '✅' : '❌'} Component card rendered: ${cardVisible}`);

    if (cardVisible) {
      const cardTitle = await page.locator('.component-card h3').textContent();
      console.log(`📄 Component title: "${cardTitle}"`);
    }

    // Test 5️⃣: Test CURSOR behavior
    console.log('\nTEST 5️⃣: Testing cursor style on hover...');
    const card = page.locator('.component-card');
    
    // Check inline cursor style
    const inlineStyle = await card.evaluate(el => el.style.cursor);
    console.log(`Inline style cursor: "${inlineStyle}"`);
    
    // Get computed style before hover
    const cursorBefore = await card.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    console.log(`Computed cursor BEFORE hover: "${cursorBefore}"`);
    
    // Hover and check
    await card.hover();
    await page.waitForTimeout(100);
    
    const cursorAfter = await card.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    console.log(`Computed cursor AFTER hover: "${cursorAfter}"`);
    console.log(`${cursorAfter === 'pointer' ? '✅' : '❌'} Cursor is pointer after hover: ${cursorAfter === 'pointer'}`);

    // Test 6️⃣: Test CLICK behavior
    console.log('\nTEST 6️⃣: Testing click opens URL...');
    
    // Monitor popup opens
    const popupPromise = new Promise(resolve => {
      page.on('popup', resolve);
    });
    
    // Check if event listener is attached
    const hasClickListener = await card.evaluate(el => {
      const listeners = getEventListeners(el);
      return !!listeners && !!listeners['click'];
    }).catch(() => 'Cannot inspect - this is normal in page context');
    console.log(`Event listeners present: ${hasClickListener}`);
    
    // Try to click
    await card.click();
    
    // Wait for popup with timeout
    const popupPage = await Promise.race([
      popupPromise,
      new Promise(resolve => setTimeout(() => resolve(null), 1000))
    ]);
    
    console.log(`${popupPage ? '✅' : '❌'} Popup opened: ${!!popupPage}`);
    
    if (popupPage) {
      const popupUrl = popupPage.url();
      console.log(`Popup URL: "${popupUrl}"`);
      await popupPage.close();
    }

    // Test 7️⃣: Check console logs
    console.log('\nTEST 7️⃣: Checking browser console messages...');
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    
    await page.reload();
    await page.waitForTimeout(500);
    
    console.log(`Found ${consoleLogs.length} console messages:`);
    consoleLogs.slice(0, 10).forEach(log => {
      const icon = log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} [${log.type}] ${log.text}`);
    });

    // Test 8️⃣: Inspect the card DOM
    console.log('\nTEST 8️⃣: Inspecting component card DOM...');
    const cardDOM = await card.evaluate(el => {
      return {
        tag: el.tagName,
        classes: Array.from(el.classList),
        id: el.id,
        inlineStyles: {
          cursor: el.style.cursor,
          pointerEvents: el.style.pointerEvents,
          userSelect: el.style.userSelect,
        },
        attributes: Array.from(el.attributes).map(a => `${a.name}="${a.value}"`),
        childCount: el.children.length,
      };
    });
    console.log('Card DOM structure:');
    console.log(JSON.stringify(cardDOM, null, 2));

    // Test 9️⃣: Test with MULTIPLE components
    console.log('\nTEST 9️⃣: Testing with multiple components...');
    const testComponents = [
      { id: '1', name: 'BBC News', url: 'https://bbc.com', html_cache: '<div>News 1</div>', last_updated: new Date().toISOString() },
      { id: '2', name: 'HotUKDeals', url: 'https://hotukdeals.com', html_cache: '<div>Deal 1</div>', last_updated: new Date().toISOString() },
      { id: '3', name: 'Another Site', url: 'https://another.com', html_cache: '<div>Content</div>', last_updated: new Date().toISOString() },
    ];
    
    await page.evaluate((comps) => {
      localStorage.setItem('components', JSON.stringify(comps));
    }, testComponents);
    
    await page.reload();
    const cardCount = await page.locator('.component-card').count();
    console.log(`${cardCount === 3 ? '✅' : '❌'} All 3 cards rendered: ${cardCount}/3`);

    // Test 1️⃣0️⃣: Test click on each
    console.log('\nTEST 1️⃣0️⃣: Testing click on each card...');
    const cards = await page.locator('.component-card').all();
    for (let i = 0; i < cards.length; i++) {
      const cardText = await cards[i].locator('h3').textContent();
      const cardUrl = await cards[i].locator('small').textContent();
      console.log(`Card ${i + 1}: ${cardText} -> ${cardUrl}`);
      
      // Check cursor
      const cursor = await cards[i].evaluate(el => window.getComputedStyle(el).cursor);
      console.log(`  Cursor: ${cursor}`);
    }

    console.log('\n========== TEST SUITE COMPLETE ==========\n');
    console.log('📊 SUMMARY: All tests executed. Review results above for failures.\n');

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.error(error);
  } finally {
    await context.close();
    await browser.close();
  }
}

runTests();