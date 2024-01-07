export const invalidatePatientDataQueries = (queryClient, patientId) => {
  queryClient.invalidateQueries(['additionalData', patientId]);
  queryClient.invalidateQueries(['birthData', patientId]);
  queryClient.invalidateQueries(['patientFields', patientId]);
};
