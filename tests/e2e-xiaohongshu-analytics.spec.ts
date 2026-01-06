import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Xiaohongshu Analytics Tool', () => {
  test('should load correctly without console errors', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto('/en/tools/xiaohongshu-analytics');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Xiaohongshu Analytics');

    // Check that all main sections are present (using getByRole for better specificity)
    await expect(page.getByRole('heading', { name: 'Upload Data' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Analysis Config' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Analysis' })).toBeVisible();

    // Check that template buttons are visible (using exact text match)
    await expect(page.getByRole('button', { name: /^Viral Note Analysis/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Content Optimization/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Publishing Time Analysis/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Engagement Boost Strategies/ })).toBeVisible();

    // Verify no console errors related to missing translations
    const translationErrors = consoleErrors.filter(e =>
      e.includes('MISSING_MESSAGE') ||
      e.includes('Tools.xiaohongshu-analytics') ||
      e.includes('Tools.cover-generator')
    );
    expect(translationErrors).toHaveLength(0);
  });

  test('should load Chinese locale correctly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/zh/tools/xiaohongshu-analytics');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('小红书分析');

    // Check Chinese text is displayed
    await expect(page.getByRole('heading', { name: '上传数据' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '分析配置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '开始分析' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^爆款笔记特征分析/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^内容优化建议/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^发布时间分析/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^互动率提升策略/ })).toBeVisible();

    // Verify no console errors
    const translationErrors = consoleErrors.filter(e =>
      e.includes('MISSING_MESSAGE')
    );
    expect(translationErrors).toHaveLength(0);
  });

  test('should handle CSV file upload', async ({ page }) => {
    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/en/tools/xiaohongshu-analytics');

    // Upload a test CSV file using setInputFiles
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/Users/chaoqiao/savethat/test-data/test-xiaohongshu.csv');

    // Manually dispatch change event to trigger React's onChange
    await fileInput.dispatchEvent('change');

    // Wait for processing
    await page.waitForTimeout(2000);

    // Check for page errors
    if (pageErrors.length > 0) {
      console.log('Page errors:', JSON.stringify(pageErrors, null, 2));
    }

    // Wait for the upload area to show the green border (successful upload)
    const uploadArea = page.locator('.border-2').first();
    await expect(uploadArea).toHaveClass(/border-green-500/, { timeout: 10000 });

    // Check that data preview is shown
    await expect(page.getByRole('heading', { name: 'Data Preview' })).toBeVisible();

    // Check that Start Analysis button is now enabled
    await expect(page.getByRole('button', { name: 'Start Analysis' })).toBeEnabled();
  });

  test('should correctly parse xlsx file with merged headers via API', async () => {
    // Test the server-side xlsx parsing via curl
    const result = execSync(
      'curl -s -X POST -F "file=@/Users/chaoqiao/savethat/test-data/笔记列表明细表.xlsx" http://localhost:3000/api/xiaohongshu/test-parse',
      { encoding: 'utf-8' }
    );
    const parseResult = JSON.parse(result);

    // Assert that parsing was successful
    expect(parseResult.success).toBe(true);
    expect(parseResult.rowCount).toBe(12);

    // Verify the column structure
    expect(parseResult.columns).toContain('笔记标题');
    expect(parseResult.columns).toContain('首次发布时间');
    expect(parseResult.columns).toContain('体裁');
    expect(parseResult.columns).toContain('曝光');
    expect(parseResult.columns).toContain('点赞');
    expect(parseResult.columns).toContain('评论');

    // Verify preview data is correct
    expect(parseResult.previewData).toHaveLength(3);
    expect(parseResult.previewData[0].title).toBe('请了个AI滑雪教练，骂的不脏但侮辱性极强🤬');
    expect(parseResult.previewData[0].likes).toBe(4);
    expect(parseResult.previewData[0].comments).toBe(2);
    expect(parseResult.previewData[0].views).toBe(296);

    expect(parseResult.previewData[1].title).toBe('claude code 让我又弃用了 cursor 😂');
    expect(parseResult.previewData[1].likes).toBe(2);
    expect(parseResult.previewData[1].views).toBe(695);
  });
});
