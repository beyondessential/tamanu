# Table Component

This is the Base component and structure to be used to build tables in the App.
It's structure is like this:

| Title     | TableHeaderCell | TableHeaderCell | TableHeaderCell | TableHeaderCell |
| --------- | --------------- | --------------- | --------------- | --------------- |
| RowHeader | TableData       | TableData       | TableData       | TableData       |
| RowHeader | TableData       | TableData       | TableData       | TableData       |
| RowHeader | TableData       | TableData       | TableData       | TableData       |

- Main Component
- Title
- RowHeaders
- TableData
- TableHeaderCell
- TableCol
- TableCell

## MainComponent

The MainComponent renders as a row 2 components:

- The Title with RowHeaders (properties of the Table)
- TableData (basically a Row with the column headers and the data)

## Title

Component responsible for rendering the table title property.

## RowHeaders

Component responsible for renderind the far left Column of Headers (properties of the table).

## TableData

Receives the data property and renders the data and TableHeaderCells:

| Title     | TableCol |
| --------- | -------- |
| RowHeader | TableCol |

### TableCol

Inside the TableData, it renders the table data as a column <strong> with the header of the table</strong>.

#### TableHeaderCell

Component inside TableCol that is responsible for rendering the content inside the Header of the Column

#### Table Columns

A JSON data provided with the accessor method to be provided inside TableCol and render the columns of the data provided:

example of a columms object:

```ts
export const vitalsTableCols: Column[] = [
  {
    id: 1,
    key: 'bloodPressure',
    title: 'Blood Pressure',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.bloodPressure}
      </VitalsTableCell>
    ),
  },
];
```

#### TableCell

Component inside TableCol that is rendered through an accessor from the Columns data.
