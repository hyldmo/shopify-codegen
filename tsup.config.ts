import { defineConfig } from 'tsup'

export default defineConfig([
	{
		entry: { index: 'src/index.ts' },
		format: ['esm', 'cjs'],
		dts: true,
		clean: true,
		shims: true
	},
	{
		entry: { cli: 'src/cli.ts' },
		format: ['esm'],
		dts: true
	}
])
