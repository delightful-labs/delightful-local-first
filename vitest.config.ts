import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/lib/machines/**/*.test.ts', 'src/lib/localization/**/*.test.ts'],
		allowOnly: !process.env.CI
	}
})
