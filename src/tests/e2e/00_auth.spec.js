/**
 * E2E Tests: Login Screen
 *
 * Runs with a clean (unauthenticated) browser context — overrides the
 * project-level storageState so there is no saved session.
 *
 * Covers: toggle, form validation, password strength, successful login.
 */

import { test, expect } from '@playwright/test'

// Override the project-level storageState — these tests need a fresh browser
test.use({ storageState: { cookies: [], origins: [] } })

// ─── helpers ────────────────────────────────────────────────────────────────
async function openLoginScreen(page) {
    await page.goto('./')
    // The app checks Supabase session on mount (async). Wait generously for the
    // login form — no session exists in this context so it always appears.
    await page.waitForSelector('input[type="email"]', { timeout: 30000 })
}

// ══════════════════════════════════════════════════════════════════════════════
// Login screen renders
// ══════════════════════════════════════════════════════════════════════════════

test.describe.skip('Login screen — renders correctly', () => {
    test('shows the Affinity branding on the left panel', async ({ page }) => {
        await openLoginScreen(page)
        await expect(page.getByText('Affinity')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/auth_01_login_screen.png' })
    })

    test('shows the Log In / Sign Up toggle', async ({ page }) => {
        await openLoginScreen(page)
        await expect(page.getByText('Log In')).toBeVisible()
        await expect(page.getByText('Sign Up')).toBeVisible()
    })

    test('defaults to Log In mode', async ({ page }) => {
        await openLoginScreen(page)
        await expect(page.getByText('Welcome back')).toBeVisible()
    })

    test('shows email and password fields', async ({ page }) => {
        await openLoginScreen(page)
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Toggle between modes
// ══════════════════════════════════════════════════════════════════════════════

test.describe.skip('Login screen — mode toggle', () => {
    test('switches to Sign Up mode when Sign Up is clicked', async ({ page }) => {
        await openLoginScreen(page)
        await page.getByText('Sign Up').click()
        await expect(page.getByText('Create your account')).toBeVisible({ timeout: 3000 })
        await page.screenshot({ path: 'test-results/screenshots/auth_02_signup_mode.png' })
    })

    test('shows a confirm password field in Sign Up mode', async ({ page }) => {
        await openLoginScreen(page)
        await page.getByText('Sign Up').click()
        // There should now be two password fields
        const passwordFields = page.locator('input[type="password"], input[type="text"].login-input')
        await expect(passwordFields.first()).toBeVisible()
    })

    test('switches back to Log In mode from Sign Up', async ({ page }) => {
        await openLoginScreen(page)
        await page.getByText('Sign Up').click()
        await page.getByText('Log In').click()
        await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 3000 })
    })

    test('submit button says "Log In" in login mode', async ({ page }) => {
        await openLoginScreen(page)
        await expect(page.locator('.login-submit')).toContainText('Log In')
    })

    test('submit button says "Create Account" in signup mode', async ({ page }) => {
        await openLoginScreen(page)
        await page.getByText('Sign Up').click()
        await expect(page.locator('.login-submit')).toContainText('Create Account', { timeout: 3000 })
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Form validation
// ══════════════════════════════════════════════════════════════════════════════

test.describe.skip('Login screen — form validation', () => {
    test('shows an error when submitting with empty email', async ({ page }) => {
        await openLoginScreen(page)
        await page.click('.login-submit')
        await expect(page.getByText(/enter your email/i)).toBeVisible({ timeout: 3000 })
    })

    test('shows an error when submitting with empty password', async ({ page }) => {
        await openLoginScreen(page)
        await page.fill('input[type="email"]', 'test@example.com')
        await page.click('.login-submit')
        await expect(page.getByText(/enter your password/i)).toBeVisible({ timeout: 3000 })
    })

    test('shows an error for invalid credentials', async ({ page }) => {
        await openLoginScreen(page)
        await page.fill('input[type="email"]', 'nobody@nowhere.com')
        await page.fill('input[type="password"]', 'WrongPassword99!')
        await page.click('.login-submit')
        // Supabase returns an error; app displays it
        await expect(page.locator('.login-error, [class*="error"]')).toBeVisible({ timeout: 10000 })
        await page.screenshot({ path: 'test-results/screenshots/auth_03_invalid_credentials.png' })
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Password strength meter (Sign Up mode)
// ══════════════════════════════════════════════════════════════════════════════

test.describe.skip('Login screen — password strength meter', () => {
    test.beforeEach(async ({ page }) => {
        await openLoginScreen(page)
        await page.getByText('Sign Up').click()
    })

    test('strength meter appears when typing in password field', async ({ page }) => {
        await page.locator('input[placeholder*="strong"]').fill('abc')
        // Strength meter rules list should appear
        await expect(page.locator('.strength-meter, .pw-rule, [class*="strength"]').first()).toBeVisible({ timeout: 3000 })
    })

    test('short password fails the length requirement', async ({ page }) => {
        await page.locator('input[placeholder*="strong"]').fill('Short1!')
        await page.screenshot({ path: 'test-results/screenshots/auth_04_weak_password.png' })
        // Submit button should show validation issue (form blocks or error shows)
        // We verify there are failing rules visible
        const failedRules = page.locator('[class*="rule"]:not([class*="pass"]), [class*="rule"][style*="opacity: 0.4"]')
        expect(await failedRules.count()).toBeGreaterThan(0)
    })
})

// ══════════════════════════════════════════════════════════════════════════════
// Successful login
// ══════════════════════════════════════════════════════════════════════════════

test.describe.skip('Login screen — successful login', () => {
    test('logs in with valid credentials and shows main menu', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('app_user_name', 'Test')
        })
        await openLoginScreen(page)

        await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL)
        await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD)
        await page.click('.login-submit')

        await page.waitForSelector('text=Revise', { timeout: 20000 })
        await expect(page.getByText('Revise')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/auth_05_logged_in.png' })
    })
})
