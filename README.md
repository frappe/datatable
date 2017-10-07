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

* `npm run dev` - run this command and start hacking
* `npm run test` - run tests

## License

MIT