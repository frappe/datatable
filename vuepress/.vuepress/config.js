const path = require('path');

const outputPath = path.resolve('./static/docs/datatable')

module.exports = {
    title: 'Frappe DataTable',
    description: 'A simple, modern and interactive datatable for the web',
    dest: outputPath,
    base: '/docs/datatable',
    themeConfig: {
        sidebar: [
            '/getting-started',
            '/download',
            '/configuration',
            '/events'
        ],
        nav: [
            { text: 'Documentation', link: '/getting-started'},
            { text: 'GitHub', link: 'https://github.com/frappe/datatable'},
        ]
    }
}