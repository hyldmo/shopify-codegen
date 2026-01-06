import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SectionResult, ShopifyBlock, ShopifySchema } from './types.js'
import { extractSchema, getTypeScriptType, toPascalCase } from './utils.js'

export function generateSettingsType(settings: ShopifyBlock['settings'] | undefined, indent = '\t'): string {
	if (!(settings && Array.isArray(settings))) return ''

	const props: string[] = []

	for (const setting of settings) {
		if (setting.type === 'header') continue
		if (!setting.id) continue

		const propName = setting.id
		const propType = getTypeScriptType(setting)
		const hasDefault = 'default' in setting && setting.default !== undefined
		const isOptional =
			hasDefault ||
			setting.type === 'image_picker' ||
			setting.type === 'product' ||
			setting.type === 'collection' ||
			setting.type === 'page' ||
			setting.type === 'video' ||
			setting.type === 'video_url'

		if (propType) {
			props.push(`${indent}${propName}${isOptional ? '?' : ''}: ${propType}`)
		}
	}

	return props.join('\n')
}

export function generateBlockType(block: ShopifyBlock, sectionName: string, prefix = false): string {
	const sectionNamePascal = toPascalCase(sectionName)

	if (block.type === '@app') {
		const appName = prefix ? `${sectionNamePascal}AppBlock` : `${sectionNamePascal}App`
		return `export interface ${appName} extends Block {
\ttype: '@app'
\tsettings: BlockSettings
}`
	}

	const blockTypePascal = toPascalCase(block.type)
	const blockName = prefix ? `${sectionNamePascal}${blockTypePascal}Block` : `${sectionNamePascal}${blockTypePascal}`
	const settingsType = generateSettingsType(block.settings, '\t\t')

	return `export interface ${blockName.replace('BlockBlock', 'Block')} extends Block {
\ttype: '${block.type}'
\tsettings: {
${settingsType}
\t}
}`
}

export function generateSectionType(schema: ShopifySchema, fileName: string, prefix = false): string {
	const baseName = toPascalCase(fileName.replace(/\.liquid$/, ''))
	const interfaceName = (prefix ? `${baseName}Section` : baseName).replace('SectionSection', 'Section')
	const settingsType = generateSettingsType(schema.settings, '\t\t')

	let blocksType = 'Block[]'
	if (schema.blocks && schema.blocks.length > 0) {
		const blockTypes = schema.blocks.map(block => {
			if (block.type === '@app') {
				return prefix ? `${baseName}AppBlock` : `${baseName}App`
			}
			return prefix ? `${baseName}${toPascalCase(block.type)}Block` : `${baseName}${toPascalCase(block.type)}`
		})
		blocksType = blockTypes.length > 1 ? `Array<${blockTypes.join(' | ')}>` : `${blockTypes[0]}[]`
	}

	const tag = schema.tag || 'section'

	return `export interface ${interfaceName} extends ShopifySection {
\tname: '${schema.name}'
\ttag: '${tag}'
\tsettings: {
${settingsType}
\t}
\tblocks: ${blocksType}
}`
}

export function generateBlockTypes(schema: ShopifySchema, fileName: string, prefix = false): string[] {
	if (!schema.blocks) return []

	const sectionName = toPascalCase(fileName.replace(/\.liquid$/, ''))
	return schema.blocks.map(block => generateBlockType(block, sectionName, prefix))
}

export async function generateTypes(options: { sectionsDir: string; prefix?: boolean }): Promise<string> {
	const { sectionsDir, prefix = false } = options
	const dir = await readdir(sectionsDir)
	const files = dir.filter(file => file.endsWith('.liquid'))

	const allBlockTypes = new Map<string, string>()

	const sections = await Promise.all(
		files.map(async (file): Promise<SectionResult> => {
			const filePath = join(sectionsDir, file)
			const content = await readFile(filePath, 'utf-8')
			const schema = extractSchema(content, file)
			if (!schema) {
				return {
					fileName: file,
					schema: null,
					sectionType: '',
					blockTypes: [],
					interfaceName: ''
				}
			}

			const baseName = toPascalCase(file.replace(/\.liquid$/, ''))
			const interfaceName = prefix ? `${baseName}Section` : baseName

			if (schema.blocks && Array.isArray(schema.blocks)) {
				for (const block of schema.blocks) {
					let blockTypeName: string
					if (block.type === '@app') {
						blockTypeName = prefix ? `${baseName}AppBlock` : `${baseName}App`
					} else {
						if (!(block.settings && Array.isArray(block.settings))) continue
						blockTypeName = prefix
							? `${baseName}${toPascalCase(block.type)}Block`
							: `${baseName}${toPascalCase(block.type)}`
					}
					if (!allBlockTypes.has(blockTypeName)) {
						allBlockTypes.set(blockTypeName, generateBlockType(block, baseName, prefix))
					}
				}
			}
			return {
				schema,
				sectionType: generateSectionType(schema, file, prefix),
				blockTypes: generateBlockTypes(schema, file, prefix),
				fileName: file,
				interfaceName
			}
		})
	)

	const blockTypes = Array.from(allBlockTypes.values())
	const sectionTypes = sections.filter(section => section.schema !== null).map(({ sectionType }) => sectionType)
	const unionType = sections
		.filter(section => section.schema !== null)
		.map(({ interfaceName }) => interfaceName)
		.join('\n\t| ')

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
