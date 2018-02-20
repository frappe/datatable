# Frappé DataTable

A modern datatable library for the web

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