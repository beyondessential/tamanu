
export const MATCH_ANY = '**MATCH_ANY**';

// const test
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
    message: buildErrorMessage([
      `Expected an empty report, received: ${receivedData.length} rows`,
    ]),
  };
}

const failForMismatchingHeadings = (receivedHeadings, expectedHeaders) => ({
  pass: false,
  message: buildErrorMessage([
    `Incorrect columns,\nReceived: ${receivedHeadings}\nExpected: ${expectedHeaders}`,
  ]),
})

const testReportLength = (receivedData, expectedData) => {
  return {
    pass: receivedData.length === expectedData.length,
    errors: [ // Don't set this if it passes!! TODO
      `Incorrect number of rows: Received: ${receivedData.length}, Expected: ${expectedData.length}`,
    ],
  }
}

const testReportContentLine = (expectContextThis, getProperty, expectedRow, receivedRow, index) => {
  const receivedRow = receivedData[i];
  const errors = [];
  Object.entries(expectedRow).forEach(([key, expectedValue]) => {
    const receivedValue = getProperty(receivedRow, key);
    if (receivedValue !== expectedValue && expectedValue !== MATCH_ANY) {
      errors.push(
        `Row: ${i}, Key: ${key},  Expected: ${expectContextThis.utils.printExpected(
          expectedValue,
        )}, Received: ${expectContextThis.utils.printReceived(receivedValue)}`,
      );
    }
  });
  return errors;
}

export const toMatchTabularReport = (expectContextThis, receivedReport, expectedData, { partialMatching = false }) => {
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
  const buildErrorMessage = buildBuildErrorMessage(expectContextThis);
  const [receivedHeadings, ...receivedData] = receivedReport;
  // Note: this line requires that the keys in `expectedData` are ordered
  const expectedHeaders = Object.keys(expectedData[0]);

  const keyToIndex = expectedHeaders.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});
  const getProperty = (row, prop) => row[keyToIndex[prop]];

  if (expectContextThis.isNot || expectContextThis.promise) {
    throw new Error('toMatchTabularReport does not support promises or "not" yet');
  }

  if (expectedData.length === 0) return testEmptyReport()
  if (receivedData.length === 0) return ({ 
    pass: false,
    message: buildErrorMessage(`Incorrect number of rows: Received: ${receivedData.length}, Expected: ${expectedData.length}`) 
  });

  if (!partialMatching && !expectContextThis.equals(receivedHeadings, expectedHeaders)) {
    return failForMismatchingHeadings(receivedHeadings, expectedHeaders);
  }

  const errors = testReportLength(receivedData, expectedData);

  expectedData.forEach((expectedRow, index) => {
    errors.push(testReportContentLine(expectContextThis, getProperty, expectedRow, receivedRow, index))
  });

  return {
    pass: !errors.length,
    message: buildErrorMessage(errors),
  };
},
});