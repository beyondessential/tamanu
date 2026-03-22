export const invalidatePatientDataQueries = async (queryClient, patientId) => {
  return Promise.all([
    queryClient.invalidateQueries(['additionalData', patientId]),
    queryClient.invalidateQueries(['birthData', patientId]),
    queryClient.invalidateQueries(['patientFields', patientId]),
    queryClient.invalidateQueries(['insurancePlans', patientId]),
  ]);
};
