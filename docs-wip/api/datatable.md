## Datatable

All the methods listed here are available on the `datatable` instance created using the `DataTable` constructor.

Example
```javascript
const datatable = new DataTable(container, options);
datatable.refresh(data);
```

#### refresh

Refreshes the datatable with new `data` and `column`

```javascript
refresh(data: Array, columns: Array): void

// Usage
datatable.refresh(data, columns);
```

---

#### setDimensions

Refreshes the datatable layout.

```javascript
setDimensions(): void

// Usage
datatable.setDimensions();
```

---

#### appendRows

Append new rows to the datatable

```javascript
appendRows(rows: Array): void

// Usage
datatable.appendRows(rows);
```

---

#### showToastMessage

Show a toast message at the bottom center of the datatable. You can hide the message by providing `hideAfter` value which is in seconds.

```javascript
showToastMessage(message: String, hideAfter: Number): void

// Usage
datatable.showToastMessage('Hey', 2);
```

---

#### clearToastMessage

Clear any toast message in the datatable.

```javascript
clearToastMessage(): void

// Usage
datatable.clearToastMessage();
```

---

#### getColumns

Get all the columns

```javascript
getColumns(): Array

// Usage
datatable.getColumns();
```

---

#### getRows

Get all the rows

```javascript
getRows(): Array

// Usage
datatable.getRows();
```

---

#### freeze

Show an overlay on the datatable which displays the `freezeMessage` value provided in `options`. You cannot interact with the datatable when it is frozen.

```javascript
freeze(): void

// Usage
datatable.freeze();
```

---

#### unfreeze

Remove the freeze overlay.

```javascript
unfreeze(): void

// Usage
datatable.unfreeze();
```

