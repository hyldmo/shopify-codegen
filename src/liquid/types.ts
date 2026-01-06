import type { HTMLAttributes } from 'react'

export interface ShopifySettingBase<T = string> {
	type: string
	id: string
	default?: T
}

export type ShopifySetting =
	| ({
			type: 'text' | 'textarea' | 'html' | 'url' | 'product' | 'collection' | 'page' | 'image_picker'
	  } & ShopifySettingBase<string>)
	| ({ type: 'color' } & ShopifySettingBase<string>)
	| ({ type: 'richtext' } & ShopifySettingBase<ShopifyRichText>)
	| ({ type: 'checkbox' } & ShopifySettingBase<boolean>)
	| ({
			type: 'range' | 'number'
			min?: number
			max?: number
	  } & ShopifySettingBase<number>)
	| ({
			type: 'select'
			options: Array<{ value: string; label: string }>
	  } & ShopifySettingBase<string>)
	| ({
			type: 'video_url'
			accept?: string[]
	  } & ShopifySettingBase<string>)
	| { type: 'header'; content: string }
	| { type: 'video'; id: string }

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

export interface SectionResult {
	fileName: string
	schema: ShopifySchema | null
	sectionType: string
	interfaceName: string
	blockTypes: string[]
}

/**
 * Needs to be used in {@link HTMLAttributes<HTMLElement>['dangerouslySetInnerHTML']}
 * instead of in the `children` prop
 */
export type ShopifyRichText = NonNullable<HTMLAttributes<HTMLElement>['dangerouslySetInnerHTML']>['__html']

export interface ShopifySection {
	id: string
	name: string
	tag: string
	title: string
	settings: Settings
	blocks: Block[]
}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for extension
export interface Settings {}

export interface Block {
	id: string
	type: string
	settings: BlockSettings
	attributes?: string
}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for extension
export interface BlockSettings {}
