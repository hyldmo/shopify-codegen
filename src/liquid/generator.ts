import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SectionResult, ShopifyBlock, ShopifySchema } from './types.js'
import { deduplicateSuffix, extractSchema, getTypeScriptType, toPascalCase } from './utils.js'

function getBlockTypeName(block: ShopifyBlock, baseName: string, prefix: boolean): string {
	if (block.type === '@app') {
		return deduplicateSuffix(prefix ? `${baseName}AppBlock` : `${baseName}App`, 'Block')
	}
	return deduplicateSuffix(
		prefix ? `${baseName}${toPascalCase(block.type)}Block` : `${baseName}${toPascalCase(block.type)}`,
		'Block'
	)
}

function getSectionTypeName(baseName: string, prefix: boolean): string {
	return deduplicateSuffix(prefix ? `${baseName}Section` : baseName, 'Section')
}

export function generateSettingsType(settings: ShopifyBlock['settings'] | undefined, indent = '\t'): string {
	if (!(settings && Array.isArray(settings))) return ''

	const props: string[] = []

	for (const setting of settings) {
		if (setting.type === 'header') continue
		if (!setting.id) continue

		const propName = setting.id
		const propType = getTypeScriptType(setting)
		const hasDefault = 'default' in setting && setting.default !== undefined
		const alwaysSet = setting.type === 'richtext' || setting.type === 'checkbox'
		const isRequired = hasDefault || alwaysSet

		if (propType) {
			props.push(`${indent}${propName}${isRequired ? '' : '?'}: ${propType}`)
		}
	}

	return props.join('\n')
}

export function generateBlockType(block: ShopifyBlock, blockTypeName: string): string {
	if (block.type === '@app') {
		return `export interface ${blockTypeName} extends Block {
\ttype: '@app'
\tsettings: BlockSettings
}`
	}

	const settingsType = generateSettingsType(block.settings, '\t\t')

	return `export interface ${blockTypeName} extends Block {
\ttype: '${block.type}'
\tsettings: {
${settingsType}
\t}
}`
}

export function generateSectionType(schema: ShopifySchema, interfaceName: string, blockTypeNames: string[]): string {
	const settingsType = generateSettingsType(schema.settings, '\t\t')

	let blocksProperty = ''
	if (blockTypeNames.length > 0) {
		const blocksType = blockTypeNames.length > 1 ? `Array<${blockTypeNames.join(' | ')}>` : `${blockTypeNames[0]}[]`
		blocksProperty = `\tblocks: ${blocksType}`
	}

	const tag = schema.tag || 'section'

	return `export interface ${interfaceName} extends ShopifySection {
\tname: '${schema.name}'
\ttag: '${tag}'
\tsettings: {
${settingsType}
\t}${blocksProperty ? `\n${blocksProperty}` : ''}
}`
}

function isValidBlock(block: ShopifyBlock): boolean {
	if (block.type === '@app') return true
	return block.settings && Array.isArray(block.settings)
}

export async function generateTypes(options: { sectionsDir: string; prefix?: boolean }): Promise<string> {
	const { sectionsDir, prefix = false } = options
	const dir = await readdir(sectionsDir)
	const files = dir.filter(file => file.endsWith('.liquid'))

	const _sections = await Promise.all(
		files.map(async (file): Promise<SectionResult | null> => {
			const filePath = join(sectionsDir, file)
			const content = await readFile(filePath, 'utf-8')
			const schema = extractSchema(content, file)
			if (!schema) return null

			const baseName = toPascalCase(file.replace(/\.liquid$/, ''))
			const interfaceName = getSectionTypeName(baseName, prefix)

			const blockTypes = (schema.blocks ?? []).filter(isValidBlock).map(block => ({
				name: getBlockTypeName(block, baseName, prefix),
				block
			}))

			const blockTypeNames = blockTypes.map(({ name }) => name)

			return {
				schema,
				sectionType: generateSectionType(schema, interfaceName, blockTypeNames),
				fileName: file,
				interfaceName,
				blockTypes: blockTypes.map(({ name, block }) => generateBlockType(block, name))
			}
		})
	)
	const sections = _sections.filter((section): section is SectionResult => section !== null)

	const blockTypes = sections.flatMap(section => section.blockTypes)
	const sectionTypes = sections.map(({ sectionType }) => sectionType)
	const unionType = sections.map(({ interfaceName }) => interfaceName).join('\n\t| ')

	const output = `
import type {
	Block,
	BlockSettings,
	Settings,
	ShopifyRichText,
	ShopifySection
} from 'shopify-codegen'

export type ShopifySections = Array<
\t${unionType}
>

export type { Block, BlockSettings, ShopifyRichText, Settings, ShopifySection }

${sectionTypes.join('\n\n')}

${blockTypes.join('\n\n')}
`.trim()

	return output
}
