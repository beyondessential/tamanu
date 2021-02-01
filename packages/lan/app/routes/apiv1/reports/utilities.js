export function generateReportFromQueryData(queryData, columnTemplate) {
  return [
    columnTemplate.map(c => c.title),
    ...queryData.map(r =>
      columnTemplate.map(c => {
        try {
          return c.accessor(r);
        } catch (e) {
          return undefined;
        }
      }),
    ),
  ];
}
