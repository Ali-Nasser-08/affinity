/**
 * E2E Tests: Mobile Landing Page
 *
 * Verifies that narrow viewports show the mobile landing page
 * instead of the login screen.
 *
 * These tests use a fresh (unauthenticated) context since the mobile
 * landing page shows regardless of auth state on small screens.
 */

import { test, expect } from '@playwright/test'

// Default to iPhone 14 viewport with no saved auth state
test.use({
    viewport: { width: 390, height: 844 },
    storageState: { cookies: [], origins: [] },
})

test.describe('Mobile Landing Page', () => {
    test('shows the Affinity branding', async ({ page }) => {
        await page.goto('./')
        await expect(page.getByText('Affinity')).toBeVisible({ timeout: 10000 })
        await page.screenshot({ path: 'test-results/screenshots/16_mobile_landing.png' })
    })

    test('does NOT show the login form on mobile', async ({ page }) => {
        await page.goto('./')
        await page.waitForTimeout(1500)
        await expect(page.locator('input[type="email"]')).not.toBeVisible()
    })

    test('shows a desktop-only notice', async ({ page }) => {
        await page.goto('./')
        // MobileLandingScreen renders: "Open it on your laptop or classroom computer to get started."
        await expect(
            page.getByText(/laptop|computer/i).first()
        ).toBeVisible({ timeout: 10000 })
    })

    test('shows feature content on the page', async ({ page }) => {
        await page.goto('./')
        // The mobile landing has a "What's inside" section and feature cards
        // with texts like Stars, Lessons, Canvas, Revise etc. — check for any of them
        await expect(
            page.getByText(/stars|lessons|canvas|revise|what.s inside/i).first()
        ).toBeVisible({ timeout: 10000 })
        await page.screenshot({ path: 'test-results/screenshots/17_mobile_features.png' })
    })

    test('renders correctly at tablet width (768px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.goto('./')
        await expect(page.getByText('Affinity')).toBeVisible({ timeout: 10000 })
        await page.screenshot({ path: 'test-results/screenshots/18_tablet_landing.png' })
    })

    test('desktop width shows the login screen instead', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('./')
        // Wait for Supabase auth check to complete and login form to appear
        await expect(
            page.locator('input[type="email"]')
        ).toBeVisible({ timeout: 25000 })
    })
})
