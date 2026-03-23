/**
 * E2E Tests: Visual Snapshots
 *
 * Navigates to key screens and captures screenshots as CI artifacts.
 * These are saved to playwright-report and uploaded by the workflow —
 * useful for spotting regressions visually without pixel-diff comparisons
 * (which require committed baseline images to work).
 *
 * Uses the saved auth state from auth.setup.js — no login required.
 */

import { test, expect } from '@playwright/test'

test.describe('Visual Snapshots', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('app_user_name', 'Test Teacher')
        })
    })

    test('Main Menu loads and is visible', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector('text=Revise', { timeout: 15000 })
        await page.waitForTimeout(800)
        await expect(page.getByText('Revise')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/snap_main_menu.png', fullPage: false })
    })

    test('Revise Menu loads and is visible', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector('text=Revise', { timeout: 15000 })
        await page.getByText('Revise').first().click()
        await page.waitForSelector('text=Setup Revision', { timeout: 10000 })
        await page.waitForTimeout(800)
        await expect(page.getByText('Setup Revision')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/snap_revise_menu.png', fullPage: false })
    })

    test('Students Screen loads and is visible', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector("text=Test Teacher's class", { timeout: 15000 })
        await page.getByText("Test Teacher's class").first().click()
        await page.waitForSelector('text=Add student', { timeout: 10000 })
        await page.waitForTimeout(800)
        await expect(page.getByText('Add student')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/snap_students.png', fullPage: false })
    })

    test('Settings Screen loads and is visible', async ({ page }) => {
        await page.goto('./')
        await page.waitForSelector('text=Settings', { timeout: 15000 })
        await page.getByText('Settings').first().click()
        await page.waitForSelector('text=Profile', { timeout: 10000 })
        await page.waitForTimeout(800)
        await expect(page.getByText('Profile')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/snap_settings.png', fullPage: false })
    })
})
