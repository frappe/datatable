# Events

Hook custom actions on certain events occurred during the lifecycle of DataTable. You can define a function to be called on these events using the `events` key in `options`.

Example
```javascript

{
    events: {
        onRemoveColumn(column) {
            // your code
        }
    }
}

```

## onRemoveColumn

- params: `column`

Called when a column is removed using the dropdown option or API.

---

## onSwitchColumn

- params: `column1`, `column2`

Called when a column position is switched using the drag behaviour.

---

## onSortColumn

- params: `column`

Called when a column's sorting is changed using the dropdown or API.

---

## onCheckRow

- params: `row`

Called when a row is checked using the checkbox or API.

---
