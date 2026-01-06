import assert from 'node:assert'
import { spawn } from 'node:child_process'
import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'

const runCLI = async (args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> => {
	return new Promise(resolve => {
		const proc = spawn('node', ['dist/cli.js', ...args], {
			cwd: process.cwd(),
			stdio: 'pipe'
		})
		let stdout = ''
		let stderr = ''

		proc.stdout?.on('data', (data: Buffer) => {
			stdout += data.toString()
		})

		proc.stderr?.on('data', (data: Buffer) => {
			stderr += data.toString()
		})

		proc.on('close', code => {
			resolve({ code, stdout, stderr })
		})
	})
}

test('CLI shows help when no codegen name provided', async () => {
	const result = await runCLI([])

	assert.strictEqual(result.code, 1)
	assert(result.stdout.includes('Usage') || result.stderr.includes('Usage'))
})

test('CLI shows error for unknown codegen', async () => {
	const result = await runCLI(['unknown'])

	assert.strictEqual(result.code, 1)
	assert(
		result.stdout.includes('Unknown codegen') ||
			result.stderr.includes('Unknown codegen') ||
			result.stdout.includes('unknown')
	)
})

test('CLI generates types and outputs to stdout', async () => {
	const result = await runCLI(['liquid', '--dir', './test/data'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('export type ShopifySections'))
	assert(result.stdout.includes('import type'))
})

test('CLI generates types with --dir flag', async () => {
	const result = await runCLI(['liquid', '--dir', './test/data'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.length > 0)
})

test('CLI generates types with -d short flag', async () => {
	const result = await runCLI(['liquid', '-d', './test/data'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.length > 0)
})

test('CLI writes output to file with --output flag', async () => {
	const outputPath = join(process.cwd(), 'test-output.ts')

	try {
		const result = await runCLI(['liquid', '--dir', './test/data', '--output', outputPath])

		assert.strictEqual(result.code, 0)

		const fileContent = await readFile(outputPath, 'utf-8')
		assert(fileContent.includes('export type ShopifySections'))
		assert(fileContent.includes('import type'))
	} finally {
		try {
			await unlink(outputPath)
		} catch {
			// Ignore cleanup errors
		}
	}
})

test('CLI writes output to file with -o short flag', async () => {
	const outputPath = join(process.cwd(), 'test-output-short.ts')

	try {
		const result = await runCLI(['liquid', '--dir', './test/data', '-o', outputPath])

		assert.strictEqual(result.code, 0)

		const fileContent = await readFile(outputPath, 'utf-8')
		assert(fileContent.includes('export type ShopifySections'))
		assert(fileContent.includes('import type'))
	} finally {
		try {
			await unlink(outputPath)
		} catch {
			// Ignore cleanup errors
		}
	}
})

test('CLI generates CSS vars in SCSS format and outputs to stdout', async () => {
	const result = await runCLI(['css', '--config-path', './test/data/settings_data.json', '--lang', 'scss'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('$color-primary: #000000;'))
	assert(result.stdout.includes('$color-secondary: #ffffff;'))
	assert(result.stdout.includes('$spacing-large: 40px;'))
	assert(!result.stdout.includes('font'))
})

test('CLI generates CSS vars in LESS format', async () => {
	const result = await runCLI(['css', '--config-path', './test/data/settings_data.json', '--lang', 'less'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('@color-primary: #000000;'))
	assert(result.stdout.includes('@color-secondary: #ffffff;'))
	assert(result.stdout.includes('@spacing-large: 40px;'))
})

test('CLI writes CSS output to file', async () => {
	const outputPath = join(process.cwd(), 'test-output.scss')

	try {
		const result = await runCLI([
			'css',
			'--config-path',
			'./test/data/settings_data.json',
			'--lang',
			'scss',
			'--output',
			outputPath
		])

		assert.strictEqual(result.code, 0)

		const fileContent = await readFile(outputPath, 'utf-8')
		assert(fileContent.includes('$color-primary: #000000;'))
		assert(fileContent.includes('$color-secondary: #ffffff;'))
		assert(!fileContent.includes('font'))
	} finally {
		try {
			await unlink(outputPath)
		} catch {
			// Ignore cleanup errors
		}
	}
})

test('CLI generates types without prefix by default', async () => {
	const result = await runCLI(['liquid', '--dir', './test/data'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('export interface CustomContent extends ShopifySection'))
	assert(result.stdout.includes('export interface CustomContentText extends Block'))
	assert(result.stdout.includes('export interface CustomContentImage extends Block'))
	assert(result.stdout.includes('export type ShopifySections = Array<\n\tCustomContent'))
	assert(!result.stdout.includes('CustomContentSection'))
	assert(!result.stdout.includes('CustomContentTextBlock'))
})

test('CLI generates types with prefix when --prefix flag is set', async () => {
	const result = await runCLI(['liquid', '--dir', './test/data', '--prefix'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('export interface CustomContentSection extends ShopifySection'))
	assert(result.stdout.includes('export interface CustomContentTextBlock extends Block'))
	assert(result.stdout.includes('export interface CustomContentImageBlock extends Block'))
	assert(result.stdout.includes('export type ShopifySections = Array<\n\tCustomContentSection'))
	assert(!result.stdout.includes('export interface CustomContent extends ShopifySection'))
	assert(!result.stdout.includes('export interface CustomContentText extends Block'))
})

test('CLI writes prefixed types to file', async () => {
	const outputPath = join(process.cwd(), 'test-output-prefix.ts')

	try {
		const result = await runCLI(['liquid', '--dir', './test/data', '--prefix', '--output', outputPath])

		assert.strictEqual(result.code, 0)

		const fileContent = await readFile(outputPath, 'utf-8')
		assert(fileContent.includes('export interface CustomContentSection extends ShopifySection'))
		assert(fileContent.includes('export interface CustomContentTextBlock extends Block'))
		assert(fileContent.includes('export type ShopifySections = Array<\n\tCustomContentSection'))
	} finally {
		try {
			await unlink(outputPath)
		} catch {
			// Ignore cleanup errors
		}
	}
})
