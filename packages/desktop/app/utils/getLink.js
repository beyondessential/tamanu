const getModalParam = modal => (modal ? `/${modal}` : '');

export const getPatientLink = (category = 'all', patientId, modal) =>
  `/patients/${category}/${patientId}${getModalParam(modal)}`;

export const getEncounterLink = (category = 'all', patientId, encounterId, modal) =>
  `${getPatientLink(category, patientId)}/encounter/${encounterId}${getModalParam(modal)}`;

export const getLabRequestLink = (category = 'all', patientId, encounterId, labRequestId, modal) =>
  `${getEncounterLink(category, patientId, encounterId)}/lab-request/${labRequestId}${getModalParam(
    modal,
  )}`;

export const getImagingRequestLink = (
  category = 'all',
  patientId,
  encounterId,
  imagingRequestId,
  modal,
) =>
  `${getEncounterLink(
    category,
    patientId,
    encounterId,
  )}/imaging-request/${imagingRequestId}${getModalParam(modal)}`;
