#!/usr/bin/env node
/** biome-ignore-all lint/complexity/useLiteralKeys: Properties from index signatures (Record<string, unknown>) must be accessed with bracket notation (e.g., ['configPath'], ['lang'], ['sectionsDir']).ts(4111) */
import { writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import meow, { type Flag, type FlagType } from 'meow'
import pc from 'picocolors'
import { generateCssVars } from './css/index.js'
import { generateTypes } from './liquid/index.js'

const codegens: Record<string, (options: typeof cli.flags) => Promise<string>> = {
	liquid: options => {
		const sectionsDir = resolve(process.cwd(), options.dir)
		return generateTypes({ sectionsDir })
	},
	css: options => {
		const configPath = resolve(process.cwd(), options.configPath)
		return generateCssVars(options.lang as 'less' | 'scss', configPath)
	}
}

const cli = meow({
	importMeta: import.meta,
	inferType: true,
	allowUnknownFlags: false,
	help: `
		Usage
		  $ shopify-codegen <codegen-name> [options]

		Options
		  --dir, -d          Sections directory (liquid only)  [default: sections]
		  --output, -o        Output file path (if not provided, outputs to stdout)
		  --lang              CSS language: less or scss (css only)  [default: scss]
		  --config-path       Path to settings_data.json (css only)  [default: config/settings_data.json]

		Examples
		  $ shopify-codegen liquid
		  $ shopify-codegen liquid --dir ./custom-sections
		  $ shopify-codegen liquid -d ./sections
		  $ shopify-codegen liquid --output ./types.ts
		  $ shopify-codegen liquid -o ./generated/types.ts
		  $ shopify-codegen css --lang scss
		  $ shopify-codegen css --lang less --config-path ./theme/config/settings_data.json

		Available codegens
		  ${Object.keys(codegens).join('\n')}
		`,

	flags: {
		dir: {
			type: 'string',
			shortFlag: 'd',
			default: 'sections'
		},
		output: {
			type: 'string',
			shortFlag: 'o'
		},
		lang: {
			type: 'string',
			default: 'scss',
			choices: ['less', 'scss']
		},
		configPath: {
			type: 'string',
			default: 'config/settings_data.json'
		}
	} as const satisfies Record<string, Flag<FlagType, string, string>>
})

async function main() {
	const [codegenName] = cli.input

	if (!codegenName) {
		cli.showHelp(1)
	} else {
		const codegen = codegens[codegenName]

		if (!codegen) {
			console.error(pc.red(`Error: Unknown codegen "${codegenName}"`))
			console.error(`\nAvailable codegens: ${Object.keys(codegens).join(', ')}`)
			return process.exit(1)
		}
		const outputPath = cli.flags.output ? resolve(process.cwd(), cli.flags.output) : null
		try {
			const output = await codegen(cli.flags)
			if (outputPath) {
				await writeFile(outputPath, output, 'utf-8')
				const relativePath = relative(process.cwd(), outputPath)
				console.log(pc.green(`✓ Generated ${codegenName} written to ${relativePath}`))
			} else {
				console.log(output)
			}
		} catch (error) {
			console.error(pc.red(`Error generating ${codegenName}:`), error)
			process.exit(1)
		}
	}
}

await main()
