export type columnTemplateType = { 
  title: string, 
  accessor: (data: object) => string | number | object | boolean
};

export const generateReportFromQueryData = (queryData: object[], columnTemplate: columnTemplateType[]) => [
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
