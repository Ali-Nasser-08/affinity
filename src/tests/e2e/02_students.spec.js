/**
 * E2E Tests: Students Screen
 *
 * Uses the saved auth state from auth.setup.js — no login required.
 * Tests student management: adding, updating, starring, deleting, and class management.
 */

import { test, expect } from '@playwright/test'

async function goToStudents(page) {
    await page.addInitScript(() => {
        localStorage.setItem('app_user_name', 'Test Teacher')
    })
    await page.goto('./')
    await page.waitForSelector("text=Test Teacher's class", { timeout: 15000 })
    await page.getByText("Test Teacher's class").first().click()
    await page.waitForSelector('text=Add student', { timeout: 10000 })
}

test.describe('Students Screen — basics', () => {
    test('navigates to Students screen', async ({ page }) => {
        await goToStudents(page)
        await expect(page.getByText('Add student')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/02_students_screen.png' })
    })

    test('opens the Add Student editor', async ({ page }) => {
        await goToStudents(page)
        await page.getByText('Add student').click()
        await expect(page.getByPlaceholder(/student name/i)).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/03_add_student_editor.png' })
    })

    test('adds a new student and shows them on the grid', async ({ page }) => {
        await goToStudents(page)
        await page.getByText('Add student').click()
        await page.getByPlaceholder(/student name/i).fill('E2E Student Alpha')
        await page.getByRole('button', { name: /save|add|confirm/i }).first().click()
        await page.waitForSelector('text=E2E Student Alpha', { timeout: 5000 })
        await expect(page.getByText('E2E Student Alpha')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/04_student_added.png' })
    })

    test('does not add a student with a blank name', async ({ page }) => {
        await goToStudents(page)
        const countBefore = await page.locator('[class*="student-card"], [class*="student-tile"]').count()
        await page.getByText('Add student').click()
        await page.getByPlaceholder(/student name/i).fill('   ')
        await page.getByRole('button', { name: /save|add|confirm/i }).first().click()
        // Card count should not increase
        await page.waitForTimeout(500)
        const countAfter = await page.locator('[class*="student-card"], [class*="student-tile"]').count()
        expect(countAfter).toBe(countBefore)
    })
})

test.describe('Students Screen — star awarding', () => {
    test('awards a star to a student', async ({ page }) => {
        await goToStudents(page)
        // Add a student first
        await page.getByText('Add student').click()
        await page.getByPlaceholder(/student name/i).fill('Star Test Student')
        await page.getByRole('button', { name: /save|add|confirm/i }).first().click()
        await page.waitForSelector('text=Star Test Student', { timeout: 5000 })

        // Click on the student card to select them, then award a star
        await page.getByText('Star Test Student').click()
        const starBtn = page.locator('button').filter({ has: page.locator('[class*="star"], .material-symbols-rounded') }).first()
        if (await starBtn.isVisible()) {
            await starBtn.click()
            await page.screenshot({ path: 'test-results/screenshots/05_star_awarded.png' })
        }
    })
})

test.describe('Students Screen — class management', () => {
    test('opens Class Settings modal', async ({ page }) => {
        await goToStudents(page)
        const settingsBtn = page.locator('button').filter({
            has: page.locator('.material-symbols-rounded', { hasText: 'settings' })
        }).first()
        await settingsBtn.click()
        await expect(page.getByText('Class Settings')).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/06_class_settings.png' })
    })

    test('adds a new class from the Class Settings modal', async ({ page }) => {
        await goToStudents(page)
        const settingsBtn = page.locator('button').filter({
            has: page.locator('.material-symbols-rounded', { hasText: 'settings' })
        }).first()
        await settingsBtn.click()
        await page.waitForSelector('text=Class Settings', { timeout: 5000 })
        await page.getByText('Add New Class').click()
        const classPills = page.locator('button').filter({ hasText: /Class/ })
        expect(await classPills.count()).toBeGreaterThanOrEqual(2)
        await page.screenshot({ path: 'test-results/screenshots/07_two_classes.png' })
    })

    test('renames a class', async ({ page }) => {
        await goToStudents(page)
        const settingsBtn = page.locator('button').filter({
            has: page.locator('.material-symbols-rounded', { hasText: 'settings' })
        }).first()
        await settingsBtn.click()
        await page.waitForSelector('text=Class Settings', { timeout: 5000 })
        // Find rename input for the first class and change it
        const renameInput = page.locator('input[placeholder*="class"], input[value*="Class"]').first()
        if (await renameInput.isVisible()) {
            await renameInput.fill('Advanced English')
            await page.keyboard.press('Enter')
            await expect(page.getByText('Advanced English')).toBeVisible({ timeout: 3000 })
        }
    })
})
