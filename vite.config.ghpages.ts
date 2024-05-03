import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import inject from '@rollup/plugin-inject';

export default defineConfig({
	plugins: [libInjectCss()],
	build: {
		target: 'esnext',
		rollupOptions: {
			plugins: [inject({ Buffer: ['buffer', 'Buffer'] })]
		}
	}
});
