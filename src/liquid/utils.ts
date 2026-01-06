import type { ShopifySchema, ShopifySetting } from './types.js'

export function extractSchema(liquidContent: string, fileName: string): ShopifySchema | null {
	const schema = liquidContent.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)?.[1]?.trim()
	if (!schema) return null

	try {
		return JSON.parse(schema) as ShopifySchema
	} catch (error) {
		console.error(`Failed to extract schema in ${fileName}: ${error}`)
		return null
	}
}

export function toPascalCase(str: string): string {
	return str
		.replace(/^t:/, '')
		.replace(/^@/, '')
		.replace(/[-_:.]/g, ' ')
		.replace(/\b\w/g, char => char.toUpperCase())
		.replace(/\s/g, '')
}

export function getTypeScriptType(setting: ShopifySetting): string {
	switch (setting.type) {
		case 'text':
		case 'textarea':
		case 'html':
		case 'url':
		case 'product':
		case 'collection':
		case 'page':
		case 'image_picker':
			return 'string'
		case 'richtext':
			return 'ShopifyRichText'
		case 'color':
			return 'string'
		case 'checkbox':
			return 'boolean'
		case 'range':
		case 'number':
			return 'number'
		case 'select':
			if (setting.options && setting.options.length > 0) {
				const values = setting.options.map(opt => `'${opt.value}'`).join(' | ')
				return values
			}
			return 'string'
		case 'video_url':
			return '{ id: string; type: string }'
		case 'video':
			return 'string'
		case 'header':
			return ''
		default:
			return 'any'
	}
}
