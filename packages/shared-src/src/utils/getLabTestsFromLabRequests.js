export const getLabTestsFromLabRequests = async labRequests => {
  const labTests = labRequests.map(labRequest => {
    const { tests, ...labRequestData } = labRequest;
    return { ...labRequestData, ...tests };
  });

  return labTests.slice().sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
};
