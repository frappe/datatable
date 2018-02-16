import merge from 'deepmerge';
import json from 'rollup-plugin-json';
import uglify from 'rollup-plugin-uglify';
import postcss from 'rollup-plugin-postcss';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';
import cssnano from 'cssnano';

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
        cssnext(),
        cssnano()
      ]
    })
  ],
  external: ['sortablejs', 'clusterize.js']
};

const prod = merge(dev, {
  output: {
    file: 'dist/frappe-datatable.min.js'
  },
  plugins: [
    postcss({
      extract: 'dist/frappe-datatable.min.css',
      plugins: [
        nested(),
        cssnext(),
        cssnano()
      ]
    }),
    uglify()
  ]
});

export default [dev];
