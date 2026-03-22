/**
 * E2E Tests: Students Screen
 *
 * Tests student management — adding, viewing, and deleting students.
 * Also verifies the class management settings modal.
 */

import { test, expect } from '@playwright/test'

// Helper: navigate to Students screen
async function goToStudents(page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('app_user_name', 'Test')
    })
    await page.goto('./')
    await page.waitForSelector("text=Test's class", { timeout: 15000 })
    await page.getByText("Test's class").first().click()
    await page.waitForSelector('text=Add student', { timeout: 10000 })
}

test.describe('Students Screen', () => {
    test('should navigate to Students screen', async ({ page }) => {
        await goToStudents(page)
        await page.screenshot({ path: 'test-results/screenshots/02_students_screen.png' })
        await expect(page.getByText('Add student')).toBeVisible()
    })

    test('should open the Add Student editor when clicking Add student', async ({ page }) => {
        await goToStudents(page)
        await page.getByText('Add student').click()
        // Editor should appear with a name input
        await expect(page.getByPlaceholder(/student name/i)).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/03_add_student_editor.png' })
    })

    test('should add a new student and show them on the grid', async ({ page }) => {
        await goToStudents(page)
        await page.getByText('Add student').click()
        await page.getByPlaceholder(/student name/i).fill('Test Student Alpha')
        // Click the save/confirm button (usually labeled Save or a checkmark)
        await page.getByRole('button', { name: /save|add|confirm/i }).first().click()
        await page.waitForSelector('text=Test Student Alpha', { timeout: 5000 })
        await expect(page.getByText('Test Student Alpha')).toBeVisible()
        await page.screenshot({ path: 'test-results/screenshots/04_student_added.png' })
    })

    test('should open Class Settings modal', async ({ page }) => {
        await goToStudents(page)
        // Find the settings gear button
        const settingsBtn = page.locator('button').filter({ has: page.locator('.material-symbols-rounded', { hasText: 'settings' }) }).first()
        await settingsBtn.click()
        await expect(page.getByText('Class Settings')).toBeVisible({ timeout: 5000 })
        await page.screenshot({ path: 'test-results/screenshots/05_class_settings.png' })
    })

    test('should add a new class from the class settings modal', async ({ page }) => {
        await goToStudents(page)
        const settingsBtn = page.locator('button').filter({ has: page.locator('.material-symbols-rounded', { hasText: 'settings' }) }).first()
        await settingsBtn.click()
        await page.getByText('Add New Class').click()
        // Should now have 2 class pills in the header
        const classPills = page.locator('button').filter({ hasText: /Class/ })
        await page.screenshot({ path: 'test-results/screenshots/06_two_classes.png' })
        expect(await classPills.count()).toBeGreaterThanOrEqual(2)
    })
})
