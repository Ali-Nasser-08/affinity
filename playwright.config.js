// @ts-check
import { defineConfig, devices } from '@playwright/test'

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
    testDir: './src/tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // Visual HTML reporter with traces — key for research article screenshots
    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list']
    ],

    use: {
        // Base URL of the Vite dev server
        baseURL: 'http://localhost:8080/affinity-english/',

        // Capture a trace for EVERY test (enables Trace Viewer)
        trace: 'on',

        // Save a screenshot on test failure
        screenshot: 'only-on-failure',

        // Record video for every test (great for research paper)
        video: 'on',

        // Viewport to simulate a 1440p classroom display
        viewport: { width: 1440, height: 900 },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],

    // Automatically start the Vite dev server before tests run
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:8080/affinity-english/',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000
    }
})
