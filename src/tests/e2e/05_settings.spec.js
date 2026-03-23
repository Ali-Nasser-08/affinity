/**
 * E2E Tests: Settings Screen
 *
 * Covers accent color, follow pointer toggle, structured mode toggle,
 * cloud sync card, and account card visibility.
 */

import { test, expect } from '@playwright/test'

async function goToSettings(page) {
    await page.addInitScript(() => {
        localStorage.setItem('app_user_name', 'Test Teacher')
    })
    await page.goto('./')
    await page.waitForSelector('text=Settings', { timeout: 15000 })
    await page.getByText('Settings').first().click()
    await page.waitForSelector('text=Profile', { timeout: 10000 })
}

test.describe('Settings Screen — cards render', () => {
    test('shows Profile card', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Profile')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/14_settings.png' })
    })

    test('shows Follow Pointer card', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Follow Pointer')).toBeVisible()
    })

    test('shows Cloud Sync card', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Cloud Sync')).toBeVisible()
    })

    test('shows Account card', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Account')).toBeVisible()
    })

    test('shows the Accessibility section', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Accessibility')).toBeVisible()
    })
})

test.describe('Settings Screen — Profile', () => {
    test('shows teacher name input', async ({ page }) => {
        await goToSettings(page)
        await expect(page.locator('input[placeholder*="name"], input[value="Test Teacher"]')).toBeVisible()
    })

    test('shows accent color swatches', async ({ page }) => {
        await goToSettings(page)
        // Color swatches are circular buttons (border-radius: 50%) in the settings page
        const swatches = page.locator('button[style*="border-radius: 50%"]')
        expect(await swatches.count()).toBeGreaterThan(0)
    })
})

test.describe('Settings Screen — Cloud Sync', () => {
    test('Open Sync Menu button is visible', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Open Sync Menu')).toBeVisible()
    })

    test('clicking Open Sync Menu navigates to cloud sync screen', async ({ page }) => {
        await goToSettings(page)
        await page.getByText('Open Sync Menu').click()
        // Cloud sync screen should show Save and Retrieve buttons
        await expect(page.getByText(/Save|save/)).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/15_cloud_sync.png' })
    })
})

test.describe('Settings Screen — Account', () => {
    test('shows the test account email', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText(process.env.E2E_TEST_EMAIL)).toBeVisible()
    })

    test('shows the Sign Out button', async ({ page }) => {
        await goToSettings(page)
        await expect(page.getByText('Sign Out')).toBeVisible()
    })
})
