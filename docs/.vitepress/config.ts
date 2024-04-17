import { defineConfig } from 'vitepress';
import pkg from '../../package.json';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: '🔌 Firebase Web3connect',
	description: 'Your Gateway to Web3 Integration!',
	outDir: '../dist-docs',
	assetsDir: './assets',
	lastUpdated: true,
	themeConfig: {
		search: {
			provider: 'local'
		},
		editLink: {
			pattern:
				'https://github.com/hexaonelabs/firebase-web3connect/edit/main/docs/:path',
			text: 'Edit this page on GitHub'
		},
		siteTitle: 'Firebase Web3connect',
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Get Started', link: '/sdk/get-started' },
			{
				text: pkg.version,
				items: [
					{
						text: 'NPM',
						link: 'https://www.npmjs.com/package/@hexaonelabs/firebase-web3connect'
					},
					{
						text: 'Contributing',
						link: 'https://github.com/hexaonelabs/firebase-web3connect/blob/master/CONTRIBUTING.md'
					}
				]
			}
		],

		sidebar: [
			{
				text: 'Introduction',
				items: [
					{
						text: 'What is Firebase Web3connect?',
						link: '/what-is-firebase-web3connect'
					},
					{
						text: 'Blockchain Integrations',
						link: '/blockchains'
					}
				]
			},
			{
				text: 'SDK Guides',
				items: [
					{ text: 'Get Started', link: '/sdk/get-started' },
					{ text: 'Install SDK', link: '/sdk/install' },
					{ text: 'Setup SDK', link: '/sdk/setup' },
					{ text: 'Use SDK', link: '/sdk/usage' },
					{ text: 'Configure SDK options', link: '/sdk/options' }
				]
			}
		],

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/hexaonelabs/firebase-web3connect'
			}
		],

		footer: {
			copyright: `Build by <a rel="noopener" href="https://hexaonelabs.com" target="_blank">HexaOne Labs</a>`,
			message: `Released under the MIT License.`
		}
	}
});
