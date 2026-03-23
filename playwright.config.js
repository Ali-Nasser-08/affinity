// @ts-check
import { defineConfig, devices } from '@playwright/test'

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
    testDir: './src/tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list']
    ],

    timeout: 60000,

    use: {
        baseURL: 'http://localhost:8080/',
        trace: 'on',
        screenshot: 'only-on-failure',
        video: 'on',
        viewport: { width: 1440, height: 900 },
    },

    projects: [
        // ── 1. Login once and save browser state ─────────────────────────────
        {
            name: 'setup',
            testMatch: /auth\.setup\.js/,
            timeout: 90000,
        },
        // ── 2. All other tests reuse the saved auth state ─────────────────────
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        }
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:8080/',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000
    }
})
