export default {
	branches: ['main'],
	plugins: [
		'@semantic-release/commit-analyzer',
		'@semantic-release/release-notes-generator',
		'@semantic-release/changelog',
		'@semantic-release/npm',
		[
			'@semantic-release/github',
			{
				assets: ['dist/**']
			}
		],
		[
			'@semantic-release/git',
			{
				assets: ['package.json', 'yarn.lock', 'CHANGELOG.md'],
				// biome-ignore lint/suspicious/noTemplateCurlyInString: templated from library
				message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
			}
		]
	]
}
