export interface TableRowProps {
  key: string;
  title: string;
  subtitle: string;
  rowHeader?: (row: any) => Element;
  accessor: (row: any) => Element;
}
