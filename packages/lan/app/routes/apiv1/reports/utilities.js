export function generateReportFromQueryData(queryData, columnTemplate) {
  return [columnTemplate.map(c => c.title), ...queryData.map(r => columns.map(c => c.accessor(r)))];
}
