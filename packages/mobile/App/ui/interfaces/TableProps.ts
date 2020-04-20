
export interface TableRowProps {
  key: string;
  title: string;
  subtitle: string;
  rowHeader?: (row: any) => JSX.Element;
  accessor: (row: any) => JSX.Element;
}
