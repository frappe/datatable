<div align="center">
    <img src="https://github.com/frappe/design/blob/master/logos/data-table-logo.svg" height="128">
    <h2>Frappe DataTable</h2>
    <p align="center">
    <p>
    A modern datatable library for the web
    </p>
</div>

## Features

* Resizable columns
* Sorting
* Custom formatted data
* In place editing
* Efficient rendering of large data

## Usage

```js
var grid = new DataTable(document.querySelector('#data-table'), {
  data: {
    columns: [ 'Sr No.', 'First Name', 'Last Name' ],
    rows: [
      [ '1', 'Don', 'Joe' ],
      [ '2', 'Mary', 'Jane' ]
    ]
  }
});
```

## Contribute

* `yarn start` - Start rollup watch
* `yarn build` - Build js/css bundles

## License

MIT
