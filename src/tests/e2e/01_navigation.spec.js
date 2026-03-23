/**
 * E2E Tests: App Navigation & Main Menu
 *
 * Uses the saved auth state from auth.setup.js — no login required.
 */

import { test, expect } from '@playwright/test'

test.describe('App Launch & Main Menu', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('app_user_name', 'Test Teacher')
        })
        await page.goto('./')
        await page.waitForSelector('text=Revise', { timeout: 15000 })
    })

    test('main menu loads and shows the Revise button', async ({ page }) => {
        await expect(page.getByText('Revise')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/01_main_menu.png' })
    })

    test("shows the teacher's class navigation button", async ({ page }) => {
        await expect(page.getByText("Test Teacher's class")).toBeVisible()
    })

    test('shows the Canvas navigation button', async ({ page }) => {
        await expect(page.getByText('Canvas')).toBeVisible()
    })

    test('shows the Settings navigation button', async ({ page }) => {
        await expect(page.getByText('Settings')).toBeVisible()
    })

    test('navigates to the students screen', async ({ page }) => {
        await page.getByText("Test Teacher's class").first().click()
        await page.waitForSelector('text=Add student', { timeout: 10000 })
        await expect(page.getByText('Add student')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/01b_students_reached.png' })
    })

    test('navigates to the Revise Menu and returns to main menu', async ({ page }) => {
        await page.getByText('Revise').first().click()
        await page.waitForSelector('text=Setup Revision', { timeout: 10000 })
        await expect(page.getByText('Setup Revision')).toBeVisible()
        await page.getByText('Back to Menu').click()
        await page.waitForSelector('text=Revise', { timeout: 10000 })
        await expect(page.getByText('Revise')).toBeVisible()
    })

    test('navigates to Settings screen', async ({ page }) => {
        await page.getByText('Settings').first().click()
        await page.waitForSelector('text=Profile', { timeout: 10000 })
        await expect(page.getByText('Profile')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/01c_settings.png' })
    })
})
