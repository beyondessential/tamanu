export const getImagingRequestType = imagingTypes => ({ imagingType }) =>
  imagingTypes[imagingType]?.label || 'Unknown';
