export interface HistoryTableRows {
  [key: string]: {
    name: string;
    accessor?: (data: any) => string;
  };
}
