/**
 * E2E Tests: Visual Snapshots (Regression Testing)
 *
 * These tests capture a "golden" screenshot on first run and compare
 * pixel-by-pixel on subsequent runs. Any unintended visual changes are
 * highlighted in a diff view — perfect for a research article figure.
 *
 * HOW TO USE:
 *  1. Run `npm run test:e2e` once to GENERATE baseline snapshots.
 *  2. Run again after changes to SEE diffs in playwright-report/.
 *  3. If a change is intentional, run with `--update-snapshots` flag.
 */

import { test, expect } from '@playwright/test'

test.describe('Visual Regression Snapshots', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('app_user_name', 'Test')
        })
    })

    test('Main Menu — visual snapshot', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector('text=Revise', { timeout: 15000 })
        // Wait for animations to settle
        await page.waitForTimeout(800)
        await expect(page).toHaveScreenshot('main-menu.png', {
            maxDiffPixelRatio: 0.02 // Allow up to 2% pixel difference
        })
    })

    test('Revise Menu — visual snapshot', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector('text=Revise', { timeout: 15000 })
        await page.getByText('Revise').first().click()
        await page.waitForSelector('text=Setup Revision', { timeout: 10000 })
        await page.waitForTimeout(800)
        await expect(page).toHaveScreenshot('revise-menu.png', {
            maxDiffPixelRatio: 0.03
        })
    })

    test('Students Screen — visual snapshot', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector("text=Test's class", { timeout: 15000 })
        await page.getByText("Test's class").first().click()
        await page.waitForSelector('text=Add student', { timeout: 10000 })
        await page.waitForTimeout(800)
        await expect(page).toHaveScreenshot('students-screen.png', {
            maxDiffPixelRatio: 0.03
        })
    })
})
