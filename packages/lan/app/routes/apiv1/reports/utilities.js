export function generateReportFromQueryData(queryData, columnTemplate) {
  return [columnTemplate.map(c => c.title), ...queryData.map(r => columnTemplate.map(c => c.accessor(r)))];
}
