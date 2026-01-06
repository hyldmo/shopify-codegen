import { readFile } from 'node:fs/promises'

function stripComments(jsonString: string): string {
	return jsonString.replace(/\/\*[\s\S]*?\*\//g, '')
}

async function loadSettingsData(configPath: string) {
	const dataContent = await readFile(configPath, 'utf-8')
	const cleanedContent = stripComments(dataContent)
	const data = JSON.parse(cleanedContent)

	return data as {
		current: Record<string, unknown>
		presets: unknown
	}
}

export async function generateCssVars(lang: 'less' | 'scss', configPath: string) {
	const config = await loadSettingsData(configPath)
	const cssVars = Object.entries(config.current)
		.filter(([, value]) => typeof value === 'string' && !value.includes('://') && value !== '')
		.filter(([key]) => !key.includes('font'))
		.map(([key, value]) => `${lang === 'less' ? '@' : '$'}${key.replaceAll('_', '-')}: ${value};`)
		.join('\n')

	return cssVars
}
