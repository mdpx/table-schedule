import sass from 'rollup-plugin-sass'
import builtin from 'rollup-plugin-node-builtins'
import { eslint } from 'rollup-plugin-eslint'

export default [
	{
		input: 'src/index.js',
		output: {
			name: 'TableSchedule',
			file: 'dist/table-schedule.js',
			format: 'umd'
		},
		plugins: [
			sass({
				output: true
			}),
			eslint({
				exclude: [
					'src/scss/**'
				]
			}),
			builtin()
		]
    },

];
