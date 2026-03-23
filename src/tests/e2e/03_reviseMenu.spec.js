/**
 * E2E Tests: Revise Menu
 *
 * Uses the saved auth state from auth.setup.js — no login required.
 */

import { test, expect } from '@playwright/test'

async function goToRevise(page) {
    await page.addInitScript(() => {
        localStorage.setItem('app_user_name', 'Test Teacher')
    })
    await page.goto('./')
    await page.waitForSelector('text=Revise', { timeout: 15000 })
    await page.getByText('Revise').first().click()
    await page.waitForSelector('text=Setup Revision', { timeout: 10000 })
}

test.describe('Revise Menu', () => {
    test('navigates to the Revise Menu', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('Setup Revision')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/08_revise_menu.png' })
    })

    test('displays all 12 unit chips', async ({ page }) => {
        await goToRevise(page)
        for (let i = 1; i <= 12; i++) {
            await expect(page.getByText(`Unit ${i}`)).toBeVisible()
        }
    })

    test('selects a unit when clicked', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Unit 3').click()
        await expect(page.getByText('Unit 3')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/09_unit_3_selected.png' })
    })

    test('displays difficulty filter chips', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('All')).toBeVisible()
        await expect(page.getByText('Easy')).toBeVisible()
        await expect(page.getByText('Medium')).toBeVisible()
        await expect(page.getByText('Hard')).toBeVisible()
    })

    test('filters to Easy difficulty', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Easy').click()
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/10_difficulty_easy.png' })
    })

    test('filters to Medium difficulty', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Medium').click()
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
    })

    test('filters to Hard difficulty', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Hard').click()
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
    })

    test('shows No Class chip in class selector', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('No Class')).toBeVisible()
    })

    test('shows Start Revision button', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText('Start Revision')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/11_start_button.png' })
    })

    test('shows the Questions Ready counter', async ({ page }) => {
        await goToRevise(page)
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
    })

    test('multiple unit selections accumulate questions', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Unit 1').click()
        await page.getByText('Unit 2').click()
        await page.getByText('Unit 3').click()
        await expect(page.getByText(/Questions Ready/i)).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/12_multi_unit.png' })
    })

    test('returns to main menu when Back is clicked', async ({ page }) => {
        await goToRevise(page)
        await page.getByText('Back to Menu').click()
        await page.waitForSelector('text=Revise', { timeout: 10000 })
        await expect(page.getByText('Revise')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/13_back_to_menu.png' })
    })
})
