#!/usr/bin/env node
import { resolve } from 'node:path'
import meow from 'meow'
import pc from 'picocolors'
import { generateTypes } from './liquid/index.js'

type CodegenFunction = (options: { sectionsDir: string }) => Promise<string>

const codegens: Record<string, CodegenFunction> = {
	liquid: generateTypes
}

const cli = meow(
	`
	Usage
	  $ shopify-codegen <codegen-name> [options]

	Options
	  --dir, -d    Sections directory  [default: sections]

	Examples
	  $ shopify-codegen liquid
	  $ shopify-codegen liquid --dir ./custom-sections
	  $ shopify-codegen liquid -d ./sections

	Available codegens
	  ${Object.keys(codegens).join(', ')}
`,
	{
		importMeta: import.meta,
		flags: {
			dir: {
				type: 'string',
				shortFlag: 'd',
				default: 'sections'
			}
		}
	}
)

const [codegenName] = cli.input

if (!codegenName) {
	cli.showHelp(1)
} else {
	const codegen = codegens[codegenName]

	if (!codegen) {
		console.error(pc.red(`Error: Unknown codegen "${codegenName}"`))
		console.error(`\nAvailable codegens: ${Object.keys(codegens).join(', ')}`)
		process.exit(1)
	} else {
		const sectionsDir = resolve(process.cwd(), cli.flags.dir ?? 'sections')

		codegen({ sectionsDir })
			.then((output: string) => {
				console.log(output)
			})
			.catch((error: unknown) => {
				console.error(pc.red('Error generating types:'), error)
				process.exit(1)
			})
	}
}
