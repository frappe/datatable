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
                this.loadScript('//unpkg.com/sortablejs@1.7.0/Sortable.min.js'),
                this.loadScript('//unpkg.com/clusterize.js@0.18.1/clusterize.min.js'),
                this.loadScript('//unpkg.com/frappe-datatable@0.0.6/dist/frappe-datatable.min.js'),
                this.loadStyle('//unpkg.com/frappe-datatable@0.0.6/dist/frappe-datatable.min.css')
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
