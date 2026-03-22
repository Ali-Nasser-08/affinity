/**
 * E2E Tests: App Navigation & Main Menu
 *
 * Tests that the app loads, renders the main menu, and that
 * all primary navigation buttons are present and functional.
 */

import { test, expect } from '@playwright/test'

test.describe('App Launch & Main Menu', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('app_user_name', 'Test')
        })
        await page.goto('./')
    })

    test('should display the loading screen and transition to main menu', async ({ page }) => {
        // The app shows a loading screen; wait for the main menu
        await page.waitForSelector('text=Revise', { timeout: 15000 })

        // Take a snapshot for research article — Figure: Main Menu
        await page.screenshot({ path: 'test-results/screenshots/01_main_menu.png', fullPage: false })

        await expect(page.getByText('Revise')).toBeVisible()
    })

    test("should show the Test's class navigation button", async ({ page }) => {
        await page.waitForSelector("text=Test's class", { timeout: 15000 })
        await expect(page.getByText("Test's class")).toBeVisible()
    })

    test('should show the Canvas navigation button (breathing exercises)', async ({ page }) => {
        await page.waitForSelector('text=Canvas', { timeout: 15000 })
        await expect(page.getByText('Canvas')).toBeVisible()
    })
})
