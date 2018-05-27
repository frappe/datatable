<template>
    <datatable-example v-on:scriptsLoaded="initDatatable">
        <div id="example-basic"></div>
    </datatable-example>
</template>
<script>
import DatatableExample from "./datatable-example";
import { getSampleData } from "./datatableData";

export default {
  name: "DatatableBasic",
  components: {
      DatatableExample
  },
  methods: {
    initDatatable() {
      const { data } = getSampleData();
      let columns = ['Name', {name: 'Position', width: 195}, 'Office', 'Extn.', 'Start Date', 'Salary'];
      const datatable = new DataTable("#example-basic", {
        columns,
        data,
        inlineFilters: true
      });
    }
  }
};
</script>
