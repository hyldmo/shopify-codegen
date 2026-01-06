#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import meow, { type Flag, type FlagType } from 'meow'
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
	  --dir, -d       Sections directory  [default: sections]
	  --output, -o    Output file path (if not provided, outputs to stdout)

	Examples
	  $ shopify-codegen liquid
	  $ shopify-codegen liquid --dir ./custom-sections
	  $ shopify-codegen liquid -d ./sections
	  $ shopify-codegen liquid --output ./types.ts
	  $ shopify-codegen liquid -o ./generated/types.ts

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
			},
			output: {
				type: 'string',
				shortFlag: 'o'
			}
		} satisfies Record<string, Flag<FlagType, string, string>>
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
		const outputPath = cli.flags.output ? resolve(process.cwd(), cli.flags.output) : null

		codegen({ sectionsDir })
			.then(async (output: string) => {
				if (outputPath) {
					await writeFile(outputPath, output, 'utf-8')
					const relativePath = relative(process.cwd(), outputPath)
					console.log(pc.green(`✓ Generated types written to ${relativePath}`))
				} else {
					console.log(output)
				}
			})
			.catch((error: unknown) => {
				console.error(pc.red('Error generating types:'), error)
				process.exit(1)
			})
	}
}
