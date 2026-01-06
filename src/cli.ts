#!/usr/bin/env node
import { resolve } from 'path'
import { generateTypes } from './codegens/liquid/index.js'

type CodegenFunction = (options: { sectionsDir: string }) => Promise<string>

const codegens: Record<string, CodegenFunction> = {
	liquid: generateTypes
}

const args = process.argv.slice(2)
const codegenName = args[0]
const sectionsDir = args[1] ? resolve(process.cwd(), args[1]) : resolve(process.cwd(), 'sections')

if (!codegenName) {
	console.error('Error: Codegen name is required')
	console.error('Usage: shopify-codegen <codegen-name> [sections-dir]')
	console.error('Available codegens:', Object.keys(codegens).join(', '))
	process.exit(1)
}

const codegen = codegens[codegenName]

if (!codegen) {
	console.error(`Error: Unknown codegen "${codegenName}"`)
	console.error('Available codegens:', Object.keys(codegens).join(', '))
	process.exit(1)
}

codegen({ sectionsDir })
	.then(output => {
		console.log(output)
	})
	.catch(error => {
		console.error('Error generating types:', error)
		process.exit(1)
	})
