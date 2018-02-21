import json from 'rollup-plugin-json';
// import uglify from 'rollup-plugin-uglify';
import postcss from 'rollup-plugin-postcss';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';
// import cssnano from 'cssnano';

const dev = {
  input: 'src/index.js',
  output: {
    file: 'dist/frappe-datatable.js',
    format: 'iife',
    name: 'DataTable',
    globals: {
      sortablejs: 'Sortable',
      'clusterize.js': 'Clusterize'
    }
  },
  plugins: [
    json(),
    postcss({
      extract: 'dist/frappe-datatable.css',
      plugins: [
        nested(),
        cssnext()
      ]
    })
  ],
  external: ['sortablejs', 'clusterize.js']
};

export default [dev, Object.assign({}, dev, {
  output: {
    format: 'cjs',
    file: 'dist/frappe-datatable.cjs.js'
  }
})];
