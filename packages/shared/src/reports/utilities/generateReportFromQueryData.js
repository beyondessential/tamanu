export const generateReportFromQueryData = (queryData, columnTemplate) => [
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
