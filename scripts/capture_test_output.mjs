import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

try {
    execSync('npx vitest run src/tests/unit/useStudents.test.js', {
        stdio: 'pipe',
        cwd: 'c:/Users/Loy/Desktop/Work/12 - Affinity',
        env: { ...process.env, FORCE_COLOR: '0' }
    })
} catch (e) {
    const combined = (e.stdout?.toString() || '') + '\n' + (e.stderr?.toString() || '')
    writeFileSync('c:/Users/Loy/Desktop/vitest_error.txt', combined)
    console.log('Written to desktop')
}
