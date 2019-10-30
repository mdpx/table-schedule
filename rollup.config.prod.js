import sass from 'rollup-plugin-sass'
import builtin from 'rollup-plugin-node-builtins'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import postcss from 'postcss'
import cssnano from 'cssnano'
import banner from 'rollup-plugin-banner'

let common = [
	builtin(),
	babel(),
	banner('TableSchedule.js v<%= pkg.version %> by <%= pkg.author %>\n<%= pkg.repository.url %>')
]
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
			...common
		]
    },
	{
		input: 'src/index.js',
		output: {
			name: 'TableSchedule',
			file: 'dist/table-schedule.min.js',
			format: 'umd'
		},
		plugins: [
			sass({
                output: true,
                processor: css => postcss([cssnano])
                    .process(css, {
                        map: false,
                        from: undefined
                    })
                    .then(result => result.css)
			}),
			terser(),
			...common
		]
    }
];
