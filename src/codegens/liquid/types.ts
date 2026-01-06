export interface ShopifySetting {
	type:
		| 'text'
		| 'textarea'
		| 'html'
		| 'url'
		| 'product'
		| 'collection'
		| 'page'
		| 'image_picker'
		| 'richtext'
		| 'color'
		| 'checkbox'
		| 'range'
		| 'number'
		| 'select'
		| 'video_url'
		| 'header'
		| 'video'
	id?: string
	default?: string | boolean | number
	min?: number
	max?: number
	options?: Array<{ value: string; label: string }>
	accept?: string[]
	content?: string
}

export interface ShopifyBlock {
	name: string
	type: string
	settings: ShopifySetting[]
}

export interface ShopifySchema {
	name: string
	tag?: string
	class?: string
	settings: ShopifySetting[]
	blocks?: ShopifyBlock[]
	presets?: unknown[]
}

export interface GenerateOptions {
	sectionsDir: string
}

export interface SectionResult {
	fileName: string
	schema: ShopifySchema | null
	sectionType: string
	blockTypes: string[]
	interfaceName: string
}
