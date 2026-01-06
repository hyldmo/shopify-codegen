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
	const result = await runCLI(['liquid', '--dir', './test/sections'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.includes('export type ShopifySections'))
	assert(result.stdout.includes('import type'))
})

test('CLI generates types with --dir flag', async () => {
	const result = await runCLI(['liquid', '--dir', './test/sections'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.length > 0)
})

test('CLI generates types with -d short flag', async () => {
	const result = await runCLI(['liquid', '-d', './test/sections'])

	assert.strictEqual(result.code, 0)
	assert(result.stdout.length > 0)
})

test('CLI writes output to file with --output flag', async () => {
	const outputPath = join(process.cwd(), 'test-output.ts')

	try {
		const result = await runCLI(['liquid', '--dir', './test/sections', '--output', outputPath])

		assert.strictEqual(result.code, 0)
		assert(result.stdout.includes('Generated types written'))

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
		const result = await runCLI(['liquid', '--dir', './test/sections', '-o', outputPath])

		assert.strictEqual(result.code, 0)
		assert(result.stdout.includes('Generated types written'))

		const fileContent = await readFile(outputPath, 'utf-8')
		assert(fileContent.length > 0)
	} finally {
		try {
			await unlink(outputPath)
		} catch {
			// Ignore cleanup errors
		}
	}
})
