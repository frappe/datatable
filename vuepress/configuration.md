---
sidebarDepth: 2
---

# Configuration

Frappe DataTable has a lot of customizable features, this section is dedicated to enabling / disabling existing functionality.

## Container

The first parameter required by the `DataTable` constructor is the container element. You can pass in a CSS Selector or a DOM Object.

```javascript
const datatable = new DataTable('#datatable', options);
// or
const container = document.querySelector('#datatable');
const datatable = new DataTable(container, options);
```

## Options

The second parameter required by the `DataTable` constructor is the options object. The minimum required configuration is to pass `column` and `data` values.

```javascript
const options = {
    columns: ['Name', 'Position', 'Salary'],
    data: [
        ['John Doe', 'DevOps Engineer', '$12300'],
        ['Mary Jane', 'UX Design', '$14000'],
    ]
}

const datatable = new DataTable(container, options);
```

The following options are configurable:

### columns
 - Type: `Array`
 - Default: `[]`
 - Required

The minimum required value is to pass a list of column header names

```js
const options = {
    columns: ['Name', 'Position', 'Country']
}
```

You can also pass an Array of Object Descriptors for each column header

```js
const options = {
    columns: [
        {
            name: 'Name',
            id: 'name',
            editable: false,
            resizable: false,
            sortable: false,
            focusable: false,
            dropdown: false,
            width: 32,
            format: (value) => {
                return value.bold();
            }
        },
        ...
    ]
}
```

#### column / name
 - Type: `String`
 - Required

#### column / id
 - Type: `String`
 - Default: Slugified version of `name`

#### column / editable
 - Type: `Boolean`
 - Default: `true`

If this is set to false, the entire column will be read-only

#### column / resizable
 - Type: `Boolean`
 - Default: `true`

If this is set to false, the column width will be fixed and is not resizable using mouse drag

#### column / sortable
 - Type: `Boolean`
 - Default: `true`

If this is set to false, the column is not sortable using column actions

#### column / focusable
 - Type: `Boolean`
 - Default: `true`

If this is set to false, the cells in the column is not focusable on click

#### column / dropdown
 - Type: `Boolean`
 - Default: `true`

Show / Hide the dropdown action button on column header

#### column / width
 - Type: `Number`

If the `layout` option is set to
- `fluid`, then this value doesn't have any effect
- `fixed`, then this value is set in pixels
- `ratio`, then this value works similar to `flex` property in CSS. So, if column A has `width: 1` and column B has `width: 2`, then column B will occupy twice as much width as column A

#### column / format
 - Type: `Function`
 - Default: `null`

Custom Formatter function that is passed the value of the cell. You can process the value and return any valid HTML to customize how the cell is rendered.

---

### data
 - Type: `Array`
 - Default: `[]`
 - Required

The minimum required value is to pass an array of array of cell values. The order of cell values should match with the order of columns passed

```js
const options = {
    columns: ['Name', 'Position', 'Country'],
    data: [
        ['Faris', 'Software Developer', 'India'],
        ['Kenneth', 'Marketing Engineer', 'India']
    ]
}
```

You can also pass an Object Descriptor for each cell value

```js
const options = {
    columns: ['Name', 'Position', 'Country'],
    data: [
        [
            {
                content: 'Faris',
                // disable editing just for this cell
                editable: false,
                // format function takes precedence over
                // the format function defined in column header
                format: (value) => {
                    return value.fontcolor('blue');
                }
            },
            ...
        ],
        ...
    ]
}
```

### getEditor
 - Type: `Function`
 - Default: `null`

Customize the editor behaviour.

---

### serialNoColumn
 - Type: `Boolean`
 - Default: `true`

Whether to show serial number as the first column in datatable.

---

### checkboxColumn
 - Type: `Boolean`
 - Default: `false`

Whether to show checkbox column in the datatable.

---

### clusterize
 - Type: `Boolean`
 - Default: `true`

Whether to use clusterize to render the data.

> If you don't want to show large number of rows. Then you can turn this off. In that case you don't need to load the `clusterize.js` lib

---

### layout
 - Type: `String`
 - Default: `fixed`
 - Options: `fixed | fluid | ratio`

This option controls how width of each `column` is calculated in the DataTable.

#### fixed

The column width is calculated based on the content of the first row of the table. This layout can result in horizontal scroll.

#### fluid

The column width is adjusted based on the width of container. So the columns will be resized if the window is resized. This layout won't result in horizontal scroll. You will always see all the columns.

#### ratio

This layout works similar to the `flex` property in CSS. When column A has `width` set as `1` and column B as `2`, then column B's width  will be twice as much as column A.

---

### noDataMessage
 - Type: `String`
 - Default: `No Data`

The message shown when there are no rows to show in the DataTable.

---

### dynamicRowHeight
 - Type: `Boolean`
 - Default: `false`

The height of the row will be set according to the content of the cell with the maximum height in that row.

---

### cellHeight
 - Type: `Number`
 - Default: `null`

Set the height of each cell explicitly.

> If this value is set, `dynamicRowHeight` won't have any effect.

---

### inlineFilters
 - Type: `Boolean`
 - Default: `false`

Whether to enable the inline filter feature. If the value is `true`, then you can activate the filter row by pressing `Ctrl/Cmd + F` after clicking on any cell in the DataTable.

---

### treeView
 - Type: `Boolean`
 - Default: `false`

Whether to render rows in a tree structure. For this to work, you must pass the `indent` value for each row.

Example
```javascript

const data = [
    {
        'Department': 'IT Department',
        'No of People': '10',
        'indent': 0,
    },
    {
        'Department': 'Javascript Team',
        'No of People': '5',
        'indent': 1,
    },
    {
        'Department': 'Vue.js Team',
        'No of People': '3',
        'indent': 2,
    },
    {
        'Department': 'React Team',
        'No of People': '2',
        'indent': 2,
    },
    {
        'Department': 'Design Team',
        'No of People': '5',
        'indent': 1,
    },
]

const datatable = new DataTable('#datatable', {
    columns: ['Department', 'No of People'],
    data: data
});

```

---

### checkedRowStatus
 - Type: `Boolean`
 - Default: `true`

Whether to show the number of rows checked in a toast message.

---

### pasteFromClipboard
 - _Experimental_
 - Type: `Boolean`
 - Default: `false`

Whether to allow the user to paste copied content into selected cell(s).

---

### dropdownButton
 - Type: `String`
 - Default: `▼`

String to render as the dropdown button. You can pass a span with an icon class.

Example

```javascript
{
    dropdownButton: '<span class="fa fa-chevron-down"></span>'
}

```

### headerDropdown
 - Type: `Array`

When you hover over any column, you see the dropdown button which is used to perform certain actions for that column.
This option allows you to pass an array of custom buttons custom actions defined by you.

```javascript
options = {
    headerDropdown: [
        {
            label: 'Copy column contents',
            action: function (column) {
                // code to copy the column contents
            }
        },
}
```

### events
 - Type: `Object`

 The events options is described in detailed in the [next section](events.md).
