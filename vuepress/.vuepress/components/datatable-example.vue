<template>
    <div class="example">

    </div>
</template>
<script>
import config from '../config';
import { getSampleData } from './datatableData';

export default {
    name: 'DatatableExample',
    props: ['type'],
    mounted () {
        this.loadScriptsAndStyle().then(() => {
            const { columns, data } = getSampleData();
            const datatable = new DataTable('.example', {
                columns,
                data,
                // layout: 'fluid'
            })
        });
    },
    methods: {
        loadScriptsAndStyle() {
            return Promise.all([
                this.loadScript(config.base + 'js/Sortable.min.js'),
                this.loadScript(config.base + 'js/clusterize.min.js'),
                this.loadScript(config.base + 'js/frappe-datatable.js'),
                this.loadStyle(config.base + 'css/frappe-datatable.css')
            ])
        },
        loadScript(src) {
            return new Promise(resolve => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                document.body.appendChild(script);
            });
        },
        loadStyle(src) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = src;
            document.head.appendChild(link);
        }
    }
}
</script>
