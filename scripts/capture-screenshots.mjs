import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'docs', 'screenshots');
const BASE = 'http://localhost:9000';
const VP = { width: 1440, height: 900 };

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function dismissTourAndSeed(page) {
  await page.evaluate(() => {
    localStorage.setItem('tourCompleted-v12', 'true');
    sessionStorage.removeItem('tourInProgress');
  });
}

async function seedCanvasProject(page) {
  await page.evaluate(() => {
    const projects = ['ml-training-demo'];
    localStorage.setItem('canvasProjects', JSON.stringify(projects));

    const nodes = [
      { id: 'n1', type: 'data-source', label: 'Data Source', position: { x: 60, y: 200 }, size: { width: 160, height: 90 }, data: {} },
      { id: 'n2', type: 'preprocessing', label: 'Preprocessing', position: { x: 300, y: 120 }, size: { width: 160, height: 90 }, data: {} },
      { id: 'n3', type: 'feature-engineering', label: 'Feature Engineering', position: { x: 300, y: 300 }, size: { width: 180, height: 90 }, data: {} },
      { id: 'n4', type: 'model-training', label: 'Model Training', position: { x: 560, y: 200 }, size: { width: 160, height: 90 }, data: {} },
      { id: 'n5', type: 'evaluation', label: 'Evaluation', position: { x: 800, y: 200 }, size: { width: 160, height: 90 }, data: {} },
    ];
    const connections = [
      { id: 'c1', source: 'n1', target: 'n2', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'c2', source: 'n1', target: 'n3', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'c3', source: 'n2', target: 'n4', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'c4', source: 'n3', target: 'n4', sourceConnector: 'right', targetConnector: 'left' },
      { id: 'c5', source: 'n4', target: 'n5', sourceConnector: 'right', targetConnector: 'left' },
    ];
    localStorage.setItem('workflow-ml-training-demo', JSON.stringify({
      nodes, connections, timestamp: new Date().toISOString(),
    }));
  });
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VP, colorScheme: 'dark' });
  const page = await context.newPage();

  // Seed localStorage before first navigation
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await dismissTourAndSeed(page);
  await seedCanvasProject(page);

  // 1. Dashboard
  console.log('Capturing pages...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, '01-dashboard');

  // 2. Dashboard with sidebar
  const navToggle = page.locator('button[aria-label="Global navigation"]');
  if (await navToggle.isVisible()) {
    await navToggle.click();
    await page.waitForTimeout(800);
    await shot(page, '02-dashboard-sidebar');
    await navToggle.click();
    await page.waitForTimeout(300);
  }

  // 3. Canvas project listing
  await page.goto(`${BASE}/canvas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, '03-canvas-projects');

  // 4. Community Plugins
  await page.goto(`${BASE}/plugins`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, '04-community-plugins');

  // 5. Quickstarts
  await page.goto(`${BASE}/plugins/quickstarts`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot(page, '05-quickstarts');

  // 6. Canvas with workflow nodes
  await page.goto(`${BASE}/canvas/ml-training-demo`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await shot(page, '06-canvas-workflow');

  // 7. Click Execute and capture during execution
  const executeBtn = page.locator('button:has-text("Execute")');
  if (await executeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await executeBtn.click();
    await page.waitForTimeout(3500);
    await shot(page, '07-canvas-executing');

    // 8. Wait for log dialog to fill up
    await page.waitForTimeout(10000);
    await shot(page, '08-execution-log-dialog');

    // 9. Close overlay and capture final state
    const closeBtn = page.locator('.execution-overlay button[title="Close"]');
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  await shot(page, '09-canvas-completed');

  await browser.close();
  console.log(`\nDone! Screenshots saved to docs/screenshots/`);
})();
