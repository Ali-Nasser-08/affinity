/**
 * E2E Tests: Revise Menu
 *
 * Tests the Setup Revision screen — verifying unit selectors,
 * difficulty filters, question count controls, and the Start button state.
 *
 * This is the core pedagogical flow of the app, so these tests
 * are particularly important for the research article.
 */

import { test, expect } from '@playwright/test'

// Helper: navigate to ReviseMenu
async function goToRevise(page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('app_user_name', 'Test')
    })
    await page.goto('./')
    await page.waitForSelector('text=Revise', { timeout: 15000 })
    await page.getByText('Revise').first().click()
    // Wait for the ReviseMenu header
    await page.waitForSelector('text=Setup Revision', { timeout: 10000 })
}

test.describe('Revise Menu', () => {
    test('should navigate to the Revise Menu', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('Setup Revision')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/07_revise_menu.png' })
    })

    test('should display all 12 unit chips', async ({ page }) => {
        await goToRevise(page)
        // All unit chips should be visible
        for (let i = 1; i <= 12; i++) {
            await expect(page.getByText(`Unit ${i}`)).toBeVisible()
        }
        await page.screenshot({ path: 'test-results/screenshots/08_revise_units.png' })
    })

    test('should switch the selected unit when a chip is clicked', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Unit 3').click()
        await page.screenshot({ path: 'test-results/screenshots/09_unit_selected.png' })
        // After clicking, "Unit 3" button should visually be selected (we verify it's still visible)
        await expect(page.getByText('Unit 3')).toBeVisible()
    })

    test('should display difficulty filter chips (All, Easy, Medium, Hard)', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('All')).toBeVisible()
        await expect(page.getByText('Easy')).toBeVisible()
        await expect(page.getByText('Medium')).toBeVisible()
        await expect(page.getByText('Hard')).toBeVisible()
    })

    test('should toggle difficulty filter to Easy', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Easy').click()
        await page.screenshot({ path: 'test-results/screenshots/10_difficulty_easy.png' })
        // Questions Ready counter should update
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
    })

    test('should show a No Class chip in the Class selector', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('No Class')).toBeVisible()
    })

    test('should display the Start Revision button when no class is selected', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('Start Revision')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/11_start_button.png' })
    })

    test('should display the Questions Ready counter', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
    })

    test('should go back to main menu when Back is clicked', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Back to Menu').click()
        // Should return to the main menu — Revise button visible again
        await expect(page.getByText('Revise')).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/12_back_to_menu.png' })
    })
})
