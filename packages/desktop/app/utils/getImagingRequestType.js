export const getImagingRequestType = imagingTypes => ({ imagingType }) =>
  imagingTypes[imagingType]?.label || (imagingType || {}).name || 'Unknown';
