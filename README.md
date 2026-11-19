<div align="center" markdown="1">

<img width="80" alt="datatable-logo" src="https://github.com/user-attachments/assets/8235f4b9-993a-4329-97de-9431dcf63aae" >

<h1>Frappe DataTable</h1>

**A modern datatable library for the web**

[![Test and Release](https://github.com/frappe/datatable/workflows/Test%20and%20Release/badge.svg)](https://github.com/frappe/datatable/actions?query=workflow%3A%22Test+and+Release%22)
[![npm version](https://badge.fury.io/js/frappe-datatable.svg)](https://badge.fury.io/js/frappe-datatable)
![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/frappe-datatable.svg)


https://github.com/user-attachments/assets/ccc1183b-19bd-4e64-aa0f-4eef84f0be49

</div>

## Frappe Datatable

Frappe DataTable is a simple, modern and interactive datatable library for displaying tabular data. Originally built for [ERPNext](https://github.com/frappe/erpnext), it can be used to render large amount of rows without sacrificing performance and has the basic data grid features like inline editing and keyboard navigation. It does not require jQuery, unlike most data grids out there.

### Motivation

I was trying to remove all legacy UI components from the [frappe](https://github.com/frappe/frappe) codebase. We were using [SlickGrid](https://github.com/mleibman/SlickGrid) for rendering tables. It was unmaintained and UI was dated. Other datatable solutions either didn't have the features we needed or were closed source. So we built our own.


### Key Features

- **Cell**: Enable editing within individual cells and features like custom formatters, inline editing, and mouse selection. Users can easily copy cell content, navigate through cells using the keyboard, and take advantage of a custom cell editor for advanced functionality.
- **Column**: Columns are highly flexible, allowing users to reorder, resize, and sort them with ease. Additional features include hiding/removing columns and adding custom actions.
  - Freeze a column from its header menu so it stays in view while scrolling sideways, or set `sticky: true` on the column.
  - Column widths fit the widest value in all rows, and widths a user resized are kept when the data refreshes.
  - Set `sortValue` on a column to sort on a value other than the cell content.
- **Row**: Rows support advanced interactions, including row selection, tree-structured organization, and inline filters for precise control. They handle large datasets efficiently with dynamic row heights.
  - In tree view, sorting keeps child rows under their parent.
  - Total rows (`is_total_row`) and blank rows keep their place when the table is sorted.
- **Options**: `serialNoColumnLabel` sets the header of the serial number column. `saveSorting` remembers the last sort in local storage, under `sortingKey` when it is set.
- **Fuzzy filter**: set `filterMode: 'fuzzy'` on the table, or on a single column, so an inline filter matches letters typed in order with gaps allowed (`jdmr` finds "Jordan Moreau"). Each word matches on its own, in any order. Number filters such as `>100` work as before.


## Usage

```bash
yarn add frappe-datatable
# or
npm install frappe-datatable
```

> Note: [`sortablejs`](https://github.com/RubaXa/Sortable) is required to be installed as well.


```js
const datatable = new DataTable('#datatable', {
  columns: [ 'First Name', 'Last Name', 'Position' ],
  data: [
    [ 'Don', 'Joe', 'Designer' ],
    [ 'Mary', 'Jane', 'Software Developer' ]
  ]
});
```

## Development Setup

* `yarn start` - Start dev server
* Open `index.html` located in the root folder, and start development.
* Run `yarn lint` before committing changes
* `yarn test` - Run the Playwright tests against `index.html` (run `yarn playwright install chromium` once first)
* This project uses [commitizen](https://github.com/commitizen/cz-cli) for conventional commit messages, use `yarn commit` command instead of `git commit`

## Links

- [Making a new datatable for the web](https://medium.com/frapp%C3%A9-thoughts/things-i-learned-building-a-library-for-the-web-6846a588bf53)

<br>
<br>
<div align="center" style="padding-top: 0.75rem;">
	<a href="https://frappe.io" target="_blank">
		<picture>
			<source media="(prefers-color-scheme: dark)" srcset="https://frappe.io/files/Frappe-white.png">
			<img src="https://frappe.io/files/Frappe-black.png" alt="Frappe Technologies" height="28"/>
		</picture>
	</a>
</div>
