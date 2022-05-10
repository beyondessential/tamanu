type columnTemplateType = {
  title: string;
  accessor: (data: Object) => string | number | Object | boolean;
};

export const generateReportFromQueryData = (
  queryData: Object[],
  columnTemplate: columnTemplateType[],
) => [
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
