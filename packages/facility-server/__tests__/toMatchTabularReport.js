export const MATCH_ANY = '**MATCH_ANY**';

const buildBuildErrorMessage = expectContextThis => errorList => () =>
  `${expectContextThis.utils.matcherHint(
    'toMatchTabularReport',
    undefined,
    undefined,
    {},
  )}\n${errorList.join('\n')}`;

const testEmptyReport = (buildErrorMessage, receivedData) => {
  return {
    pass: receivedData.length === 0,
    message: buildErrorMessage([`Expected an empty report, received: ${receivedData.length} rows`]),
  };
};

const failForMismatchingHeadings = (buildErrorMessage, receivedHeadings, expectedHeaders) => ({
  pass: false,
  message: buildErrorMessage([
    `Incorrect columns,\nReceived: ${receivedHeadings}\nExpected: ${expectedHeaders}`,
  ]),
});

const testReportLength = (receivedData, expectedData) =>
  receivedData.length === expectedData.length
    ? []
    : [
        `Incorrect number of rows: Received: ${receivedData.length}, Expected: ${expectedData.length}`,
      ];

const testReportContentLine = (expectContextThis, getProperty, expectedRow, receivedRow, index) => {
  const errors = [];
  Object.entries(expectedRow).forEach(([key, expectedValue]) => {
    const receivedValue = getProperty(receivedRow, key);
    if (receivedValue !== expectedValue && expectedValue !== MATCH_ANY) {
      errors.push(
        `Row: ${index}, Key: ${key},  Expected: ${expectContextThis.utils.printExpected(
          expectedValue,
        )}, Received: ${expectContextThis.utils.printReceived(receivedValue)}`,
      );
    }
  });
  return errors;
};

/**
 * Usage:
 *  expect(reportData).toMatchTabularReport(
 *    [
 *      {
 *        Date: '2020-02-18',
 *        "Number of patients screened": 12,
 *      },
 *    ],
 *    // { partialMatching : true } If you want to pass a subset of columns to check
 *  );
 *
 */
export const toMatchTabularReport = (
  expectContextThis,
  receivedReport,
  expectedData,
  options = {},
) => {
  const { partialMatching = false } = options;
  const buildErrorMessage = buildBuildErrorMessage(expectContextThis);
  const [receivedHeadings, ...receivedData] = receivedReport;

  if (expectContextThis.isNot || expectContextThis.promise) {
    throw new Error('toMatchTabularReport does not support promises or "not" yet');
  }

  if (expectedData.length === 0) return testEmptyReport(buildErrorMessage, receivedData);

  // Note: this line requires that the keys in `expectedData` are ordered
  const expectedHeaders = Object.keys(expectedData[0]);

  if (!partialMatching && !expectContextThis.equals(receivedHeadings, expectedHeaders)) {
    return failForMismatchingHeadings(buildErrorMessage, receivedHeadings, expectedHeaders);
  }

  let errors = testReportLength(receivedData, expectedData);

  const keyToIndex = receivedHeadings.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});
  const getProperty = (row, prop) => row[keyToIndex[prop]];

  expectedData.forEach((expectedRow, index) => {
    const receivedRow = receivedData[index];
    // No sense in testing content if it doesn't exist
    if (!receivedRow) return;

    const lineErrors = testReportContentLine(
      expectContextThis,
      getProperty,
      expectedRow,
      receivedRow,
      index,
    );
    errors = errors.concat(lineErrors);
  });

  return {
    pass: !errors.length,
    message: buildErrorMessage(errors),
  };
};
