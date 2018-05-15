# Getting Started

The easiest way to get started with Frappe DataTable is using this [JSFiddle Demo](https://jsfiddle.net/f4qe6phc/7/). Or you can copy the following template into a new index.html file.

## Example

```html
<!-- include styles -->
<link href="https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.css">

<!-- create the container element -->
<div id="datatable"></div>

<!-- include the dependencies -->
<script src="https://unpkg.com/sortablejs@1.7.0/Sortable.min.js"></script>
<script src="https://unpkg.com/clusterize.js@0.18.0/clusterize.min.js"></script>
<!-- include the lib -->
<script src="https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.js"></script>

<!-- initialize DataTable -->
<script>
  const datatable = new DataTable('#datatable', {
    columns: ['Name', 'Position', 'Salary'],
    data: [
      ['Faris', 'Software Developer', '$1200'],
      ['Manas', 'Software Engineer', '$1400'],
    ]
  });
</script>
```