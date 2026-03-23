/**
 * Auth Setup — runs ONCE before all e2e suites.
 *
 * No browser needed. Strategy:
 *   1. Call the Supabase auth REST API directly to get a session token.
 *   2. Write the session into playwright/.auth/user.json as a storageState
 *      file — the exact format Playwright uses to pre-seed localStorage.
 *
 * When other tests load storageState from that file, the Supabase session
 * is already in localStorage before the page script runs, so the app skips
 * the login screen entirely.
 *
 * Required env vars (GitHub repo secrets or local .env):
 *   E2E_TEST_EMAIL
 *   E2E_TEST_PASSWORD
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 */

import { test as setup } from '@playwright/test'
import { mkdir, writeFile } from 'fs/promises'

const AUTH_FILE = 'playwright/.auth/user.json'

setup('authenticate test account', async ({ request }) => {
    const email       = process.env.E2E_TEST_EMAIL
    const password    = process.env.E2E_TEST_PASSWORD
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!email || !password) {
        throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set.')
    }
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set.')
    }

    // ── Step 1: get a valid session from Supabase (pure HTTP, no browser) ─────
    const res = await request.post(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
            headers: {
                apikey: supabaseKey,
                'Content-Type': 'application/json',
            },
            data: { email, password },
        }
    )

    if (!res.ok()) {
        throw new Error(`Supabase auth failed ${res.status()}: ${await res.text()}`)
    }

    const session = await res.json()

    // ── Step 2: build the Playwright storageState JSON by hand ────────────────
    // Supabase JS v2 uses "sb-{projectRef}-auth-token" as the localStorage key.
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
    const storageKey = `sb-${projectRef}-auth-token`

    const sessionData = {
        ...session,
        expires_at: Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
    }

    const storageState = {
        cookies: [],
        origins: [
            {
                origin: 'http://localhost:8080',
                localStorage: [
                    { name: storageKey,      value: JSON.stringify(sessionData) },
                    { name: 'app_user_name', value: 'Test Teacher' },
                ],
            },
        ],
    }

    // ── Step 3: write the file — no page.goto, no waitForSelector ─────────────
    await mkdir('playwright/.auth', { recursive: true })
    await writeFile(AUTH_FILE, JSON.stringify(storageState, null, 2))
})
