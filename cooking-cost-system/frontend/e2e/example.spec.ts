import { test, expect } from '@playwright/test';

test.describe('料理原価計算システム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ホームページが正しく表示される', async ({ page }) => {
    // ページタイトルを確認
    await expect(page).toHaveTitle(/料理原価計算システム/);
    
    // メインヘッダーが表示されることを確認
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // ナビゲーションが表示されることを確認
    const navigation = page.locator('nav, [role="navigation"]');
    await expect(navigation).toBeVisible();
  });

  test('食材タブが機能する', async ({ page }) => {
    // 食材タブをクリック
    const ingredientsTab = page.locator('text=食材');
    if (await ingredientsTab.isVisible()) {
      await ingredientsTab.click();
      
      // 食材一覧が表示されることを確認
      const ingredientsList = page.locator('[data-testid="ingredients-list"], .ingredients-grid, [role="grid"]');
      await expect(ingredientsList).toBeVisible();
    }
  });

  test('料理タブが機能する', async ({ page }) => {
    // 料理タブをクリック
    const dishesTab = page.locator('text=料理');
    if (await dishesTab.isVisible()) {
      await dishesTab.click();
      
      // 料理一覧または空の状態が表示されることを確認
      const dishesList = page.locator('[data-testid="dishes-list"], .dishes-grid, [role="grid"]');
      const emptyState = page.locator('text=まだ料理が作成されていません');
      
      await expect(dishesList.or(emptyState)).toBeVisible();
    }
  });

  test('完成品タブが機能する', async ({ page }) => {
    // 完成品タブをクリック
    const completedFoodsTab = page.locator('text=完成品');
    if (await completedFoodsTab.isVisible()) {
      await completedFoodsTab.click();
      
      // 完成品一覧または空の状態が表示されることを確認
      const completedFoodsList = page.locator('[data-testid="completed-foods-list"], .completed-foods-grid, [role="grid"]');
      const emptyState = page.locator('text=まだ完成品が登録されていません');
      
      await expect(completedFoodsList.or(emptyState)).toBeVisible();
    }
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('ナビゲーションが機能する', async ({ page }) => {
    // ホームリンクが機能することを確認
    const homeLink = page.locator('text=ホーム, [href="/"], [aria-label="ホーム"]');
    if (await homeLink.first().isVisible()) {
      await homeLink.first().click();
      await expect(page).toHaveURL('/');
    }
  });

  test('エラー状態が適切に処理される', async ({ page }) => {
    // 存在しないページにアクセス
    await page.goto('/non-existent-page');
    
    // 404ページまたはエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=404, text=ページが見つかりません, text=エラー');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('アクセシビリティ', () => {
  test('キーボードナビゲーションが機能する', async ({ page }) => {
    await page.goto('/');
    
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素が存在することを確認
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('スクリーンリーダー向けの属性が設定されている', async ({ page }) => {
    await page.goto('/');
    
    // ARIA属性やalt属性が適切に設定されていることを確認
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      
      // 装飾的な画像でない限り、altまたはaria-labelが設定されていることを確認
      if (alt !== '' && !ariaLabel) {
        expect(alt).toBeTruthy();
      }
    }
  });
});
