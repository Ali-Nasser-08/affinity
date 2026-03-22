import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        port: 8080
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/tests/setup.js'],
        include: ['src/tests/unit/**/*.{test.js,test.jsx}'],
        exclude: ['src/tests/e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/engine/**', 'src/hooks/**', 'src/utils/**'],
            exclude: ['src/tests/**', 'src/main.jsx', 'src/assets/**']
        }
    }
})
