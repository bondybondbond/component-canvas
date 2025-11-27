import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_ID = 'fjfehoaijfgbojpfahmoejnnnamdklkp';
const DASHBOARD_URL = `chrome-extension://${EXTENSION_ID}/dashboard.html`;

async function test() {
  console.log('\n🧪 COMPREHENSIVE EXTENSION CANVAS LINK TESTING\n');
  console.log(`Testing: Multiple links, cursor behavior, interactivity\n`);
  
  const extensionPath = path.resolve(path.join(__dirname, 'dist'));
  
  const context = await chromium.launchPersistentContext(
    path.join(__dirname, '.test-profile-comprehensive'),
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

    console.log('Loading dashboard...\n');
    await page.goto(DASHBOARD_URL, { waitUntil: 'load' });
    console.log('✅ Dashboard loaded\n');

    // ========== TEST 1: BBC WITH 10 STORIES ==========
    console.log('========== TEST 1: BBC MOST READ (10 Stories) ==========\n');
    
    const bbcComponent = {
      id: 'bbc-most-read',
      url: 'https://bbc.com/news',
      name: 'BBC News - Most Read',
      html_cache: `
        <div class="most-read-list">
          <h2>📰 Most Read</h2>
          <ol>
            <li><a href="https://bbc.com/news/articles/story1">Story 1: Breaking News Alert</a></li>
            <li><a href="https://bbc.com/news/articles/story2">Story 2: Political Update</a></li>
            <li><a href="https://bbc.com/news/articles/story3">Story 3: Business News</a></li>
            <li><a href="https://bbc.com/news/articles/story4">Story 4: Science Discovery</a></li>
            <li><a href="https://bbc.com/news/articles/story5">Story 5: Sports Headlines</a></li>
            <li><a href="https://bbc.com/news/articles/story6">Story 6: Entertainment</a></li>
            <li><a href="https://bbc.com/news/articles/story7">Story 7: Technology</a></li>
            <li><a href="https://bbc.com/news/articles/story8">Story 8: Health Report</a></li>
            <li><a href="https://bbc.com/news/articles/story9">Story 9: World News</a></li>
            <li><a href="https://bbc.com/news/articles/story10">Story 10: Weather</a></li>
          </ol>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, bbcComponent);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const allLinks = await page.locator('.component-card a').all();
    console.log(`✓ Found ${allLinks.length} links\n`);

    // Test each link
    console.log('Testing individual link clicks:\n');
    const linkTests = [];
    
    for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
      const linkIndex = i;
      const link = allLinks[linkIndex];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      
      console.log(`Link ${linkIndex + 1}: "${text}"`);
      console.log(`  → href: "${href}"`);
      
      // Test if clickable
      let newTabOpened = false;
      const pageHandler = () => { newTabOpened = true; };
      context.on('page', pageHandler);
      
      try {
        await link.click();
        await page.waitForTimeout(800);
      } catch (e) {
        console.log(`  ❌ Click failed: ${e.message}`);
      }
      
      context.off('page', pageHandler);
      
      const result = newTabOpened ? '✅ OPENED' : '❌ NO TAB';
      console.log(`  → Click result: ${result}\n`);
      
      linkTests.push({
        index: linkIndex + 1,
        text: text,
        href: href,
        clickable: newTabOpened,
      });
    }

    // Summary of BBC test
    const bbcClickable = linkTests.filter(l => l.clickable).length;
    console.log(`\n📊 BBC Test Summary:`);
    console.log(`  Total links: ${linkTests.length}`);
    console.log(`  Clickable: ${bbcClickable}/${linkTests.length}`);
    console.log(`  Result: ${bbcClickable === linkTests.length ? '✅ ALL CLICKABLE' : `⚠️  ONLY ${bbcClickable} CLICKABLE`}\n`);

    // ========== TEST 2: CURSOR BEHAVIOR ON MULTIPLE LINKS ==========
    console.log('========== TEST 2: CURSOR BEHAVIOR ACROSS LINKS ==========\n');

    const cursorTests = [];
    
    console.log('Moving cursor over each link and checking cursor style:\n');
    
    for (let i = 0; i < Math.min(allLinks.length, 5); i++) {
      const link = allLinks[i];
      const text = await link.textContent();
      
      console.log(`Link ${i + 1}: "${text}"`);
      
      // Get cursor before hover
      const cursorBefore = await link.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      });
      console.log(`  Cursor before hover: "${cursorBefore}"`);
      
      // Hover
      await link.hover();
      await page.waitForTimeout(100);
      
      // Get cursor after hover
      const cursorAfter = await link.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      });
      console.log(`  Cursor after hover: "${cursorAfter}"`);
      
      const isPointer = cursorAfter === 'pointer';
      console.log(`  Result: ${isPointer ? '✅ POINTER' : '❌ NOT POINTER'}\n`);
      
      cursorTests.push({
        index: i + 1,
        text: text,
        pointerOnHover: isPointer,
      });
    }

    const pointerCount = cursorTests.filter(c => c.pointerOnHover).length;
    console.log(`📊 Cursor Summary:`);
    console.log(`  Total tested: ${cursorTests.length}`);
    console.log(`  Show pointer: ${pointerCount}/${cursorTests.length}`);
    console.log(`  Result: ${pointerCount === cursorTests.length ? '✅ ALL SHOW POINTER' : `⚠️  INCONSISTENT`}\n`);

    // ========== TEST 3: HOTUKDEALS WITH MANY DEALS ==========
    console.log('========== TEST 3: HOTUKDEALS (Multiple Deals) ==========\n');

    const dealsComponent = {
      id: 'hotuk-deals',
      url: 'https://hotukdeals.com',
      name: 'Hot UK Deals - Today\'s Top Deals',
      html_cache: `
        <div class="deals-list">
          <h2>🔥 Today's Hot Deals</h2>
          <ul>
            <li><a href="https://hotukdeals.com/deals/deal1">£50 Off Amazon Prime - Limited Time</a> <span>50%</span></li>
            <li><a href="https://hotukdeals.com/deals/deal2">Free Shipping on Currys - Orders over £30</a> <span>FREE</span></li>
            <li><a href="https://hotukdeals.com/deals/deal3">Argos Electronics Sale - Up to 40% Off</a> <span>40%</span></li>
            <li><a href="https://hotukdeals.com/deals/deal4">ASOS Discount Code - Extra 20% Off</a> <span>20%</span></li>
            <li><a href="https://hotukdeals.com/deals/deal5">John Lewis Gift Cards - 10% Bonus</a> <span>10%</span></li>
            <li><a href="https://hotukdeals.com/deals/deal6">Boots Beauty Sale - 3 for 2 Offer</a> <span>OFFER</span></li>
            <li><a href="https://hotukdeals.com/deals/deal7">Tesco Groceries - Clubcard Prices</a> <span>VAR</span></li>
          </ul>
        </div>
      `,
      last_updated: new Date().toISOString(),
    };

    await page.evaluate((comp) => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ components: [comp] }, resolve);
      });
    }, dealsComponent);

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const dealLinks = await page.locator('.component-card a').all();
    console.log(`✓ Found ${dealLinks.length} deal links\n`);

    const dealTests = [];
    
    for (let i = 0; i < Math.min(dealLinks.length, 7); i++) {
      const link = dealLinks[i];
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      
      console.log(`Deal ${i + 1}: "${text}"`);
      console.log(`  → href: "${href}"`);
      
      let opened = false;
      const handler = () => { opened = true; };
      context.on('page', handler);
      
      await link.click().catch(() => {});
      await page.waitForTimeout(600);
      
      context.off('page', handler);
      
      console.log(`  → Result: ${opened ? '✅ OPENED' : '❌ NO TAB'}\n`);
      
      dealTests.push({
        index: i + 1,
        text: text,
        clickable: opened,
      });
    }

    const dealsClickable = dealTests.filter(d => d.clickable).length;
    console.log(`\n📊 HotUKDeals Test Summary:`);
    console.log(`  Total links: ${dealTests.length}`);
    console.log(`  Clickable: ${dealsClickable}/${dealTests.length}`);
    console.log(`  Result: ${dealsClickable === dealTests.length ? '✅ ALL CLICKABLE' : `⚠️  ONLY ${dealsClickable} CLICKABLE`}\n`);

    // ========== TEST 4: RAPID CURSOR MOVEMENT ==========
    console.log('========== TEST 4: CURSOR STABILITY (Rapid Movement) ==========\n');

    // Stay on BBC component
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);

    const rapidLinks = await page.locator('.component-card a').all();
    
    console.log('Rapidly moving cursor between links...\n');
    
    const rapidTests = [];
    
    for (let i = 0; i < Math.min(5, rapidLinks.length); i++) {
      const link = rapidLinks[i];
      
      // Hover quickly
      await link.hover();
      await page.waitForTimeout(50); // Very short wait
      
      const cursor = await link.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      });
      
      const isPointer = cursor === 'pointer';
      rapidTests.push(isPointer);
      
      console.log(`Link ${i + 1}: cursor="${cursor}" ${isPointer ? '✅' : '❌'}`);
    }

    const rapidPass = rapidTests.filter(t => t).length;
    console.log(`\nRapid movement result: ${rapidPass}/${rapidTests.length} showed correct cursor`);
    console.log(`Stability: ${rapidPass === rapidTests.length ? '✅ STABLE' : '⚠️  INCONSISTENT'}\n`);

    // ========== FINAL SUMMARY ==========
    console.log('\n========================================');
    console.log('COMPREHENSIVE TEST SUMMARY');
    console.log('========================================\n');

    console.log('🎯 KEY METRICS:\n');
    
    console.log('1. LINK CLICKABILITY:');
    console.log(`   BBC (10 stories): ${bbcClickable}/${linkTests.length} clickable`);
    console.log(`   Deals (7 deals): ${dealsClickable}/${dealTests.length} clickable`);
    console.log(`   Overall: ${bbcClickable === linkTests.length && dealsClickable === dealTests.length ? '✅ ALL WORK' : '❌ SOME BROKEN'}`);
    
    console.log('\n2. CURSOR BEHAVIOR:');
    console.log(`   Pointer on hover: ${pointerCount}/${cursorTests.length} links`);
    console.log(`   Rapid movement: ${rapidPass}/${rapidTests.length} stable`);
    console.log(`   Overall: ${pointerCount === cursorTests.length && rapidPass === rapidTests.length ? '✅ CONSISTENT' : '⚠️  ERRATIC'}`);
    
    console.log('\n3. ISSUES IDENTIFIED:');
    const issues = [];
    
    if (bbcClickable < linkTests.length) {
      issues.push(`- BBC: Only ${bbcClickable}/${linkTests.length} links clickable`);
    }
    if (dealsClickable < dealTests.length) {
      issues.push(`- Deals: Only ${dealsClickable}/${dealTests.length} links clickable`);
    }
    if (pointerCount < cursorTests.length) {
      issues.push(`- Cursor: Not all links show pointer on hover`);
    }
    if (rapidPass < rapidTests.length) {
      issues.push(`- Cursor stability: Erratic behavior on rapid movement`);
    }
    
    if (issues.length === 0) {
      console.log('   ✅ NO ISSUES FOUND');
    } else {
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    console.log('\n========================================\n');
    console.log('⏳ Browser will close in 30 seconds...\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await context.close();
    console.log('\n✅ Comprehensive testing complete');
  }
}

test();
