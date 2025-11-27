import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.join(__dirname, 'dist');

async function runTests() {
  const browser = await chromium.launchPersistentContext(
    path.join(__dirname, '.test-profile'),
    {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    }
  );

  try {
    console.log('\n========== PLAYWRIGHT TEST SUITE ==========\n');

    // Test 1: Open dashboard
    console.log('TEST 1️⃣: Opening Dashboard...');
    const page = await browser.newPage();
    const dashboardUrl = `file://${extensionPath}/dashboard.html`;
    await page.goto(dashboardUrl);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log(`✅ Dashboard loaded. Title: "${title}"`);

    // Test 2: Check if components-container exists
    console.log('\nTEST 2️⃣: Checking dashboard DOM structure...');
    const containerExists = await page.locator('#components-container').isVisible();
    console.log(`${containerExists ? '✅' : '❌'} Components container found: ${containerExists}`);

    // Test 3: Check empty state
    console.log('\nTEST 3️⃣: Checking empty state message...');
    const emptyState = await page.locator('.empty-state').isVisible();
    console.log(`${emptyState ? '✅' : '❌'} Empty state visible: ${emptyState}`);

    // Test 4: Add test data to storage and reload
    console.log('\nTEST 4️⃣: Adding test component to storage...');
    const testComponent = {
      id: 'test-1',
      url: 'https://example.com',
      selector: 'div.test',
      name: 'Test Component',
      html_cache: '<div class="test"><h2>Test Content</h2><p>This is test HTML</p></div>',
      last_updated: new Date().toISOString(),
    };
    
    await page.evaluate((component) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [component] }, resolve);
      });
    }, testComponent);
    
    console.log('✅ Test component added to storage');

    // Test 5: Reload and check if component renders
    console.log('\nTEST 5️⃣: Reloading dashboard to display component...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const componentCard = await page.locator('.component-card').isVisible();
    console.log(`${componentCard ? '✅' : '❌'} Component card rendered: ${componentCard}`);

    if (componentCard) {
      const cardText = await page.locator('.component-card h3').textContent();
      console.log(`📄 Component title: "${cardText}"`);
    }

    // Test 6: Check cursor style on hover
    console.log('\nTEST 6️⃣: Testing cursor style on component card hover...');
    const card = page.locator('.component-card');
    
    // Get computed style before hover
    const styleBeforeHover = await card.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    console.log(`Before hover - cursor: "${styleBeforeHover}"`);
    
    // Hover over card
    await card.hover();
    await page.waitForTimeout(100);
    
    // Get computed style after hover
    const styleAfterHover = await card.evaluate(el => {
      return window.getComputedStyle(el).cursor;
    });
    console.log(`After hover - cursor: "${styleAfterHover}"`);
    
    const isPointer = styleAfterHover === 'pointer';
    console.log(`${isPointer ? '✅' : '❌'} Cursor changed to pointer: ${isPointer}`);

    // Test 7: Check if click event fires
    console.log('\nTEST 7️⃣: Testing click event and URL opening...');
    
    // Listen for popup windows
    let popupOpened = false;
    const popupHandler = (page) => {
      console.log('🔗 Popup/New window detected!');
      popupOpened = true;
    };
    browser.once('page', popupHandler);
    
    // Click the component card
    await card.click();
    
    // Wait a bit for popup
    await page.waitForTimeout(500);
    
    console.log(`${popupOpened ? '✅' : '❌'} Click opened new window: ${popupOpened}`);

    // Test 8: Check console for errors
    console.log('\nTEST 8️⃣: Checking browser console for errors...');
    const messages = [];
    page.on('console', msg => messages.push({ type: msg.type(), text: msg.text() }));
    
    // Trigger a fresh load
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const errors = messages.filter(m => m.type === 'error');
    const warnings = messages.filter(m => m.type === 'warning');
    
    console.log(`Found ${errors.length} errors, ${warnings.length} warnings`);
    if (errors.length > 0) {
      errors.forEach(err => console.log(`  ❌ ERROR: ${err.text}`));
    }
    if (warnings.length > 0) {
      warnings.forEach(warn => console.log(`  ⚠️  WARNING: ${warn.text}`));
    }

    // Test 9: Inspect the actual card element
    console.log('\nTEST 9️⃣: Inspecting component card HTML structure...');
    const cardHTML = await card.evaluate(el => {
      return {
        outerHTML: el.outerHTML.substring(0, 200),
        classList: Array.from(el.classList),
        styles: {
          cursor: el.style.cursor,
          pointerEvents: el.style.pointerEvents,
        },
        onclick: !!el.onclick,
      };
    });
    console.log('Card structure:', JSON.stringify(cardHTML, null, 2));

    // Test 10: Check if dashboard.js script loaded
    console.log('\nTEST 🔟: Verifying dashboard.js is loaded...');
    const dashboardScriptLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return scripts.some(s => s.src.includes('dashboard.js'));
    });
    console.log(`${dashboardScriptLoaded ? '✅' : '❌'} dashboard.js loaded: ${dashboardScriptLoaded}`);

    console.log('\n========== TEST SUITE COMPLETE ==========\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);