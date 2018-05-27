<template>
    <datatable-example v-on:scriptsLoaded="initDatatable">
        <div id="example-cell"></div>
    </datatable-example>
</template>
<script>
import DatatableExample from "./datatable-example";
import { getSampleData } from "./datatableData";

export default {
  name: "DatatableCell",
  components: {
    DatatableExample
  },
  methods: {
    initDatatable() {
      const { data } = getSampleData();
      let columns = [
        "Name",
        { name: "Position", width: 185 },
        { name: "Office" },
        "Extn.",
        "Start Date",
        { name: "Salary", format: value => "$" + value }
      ];

      const datatable = new DataTable("#example-cell", {
        columns,
        data
      });
    }
  }
};
</script>
