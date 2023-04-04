export const sanitizeFilename = (reportName, versionNumber, format) => {
  const sanitizedName = reportName
    .trim()
    .replace(/[/?<>\\:*|"]/g, '')
    .replace(/(\s|-)+/g, '-')
    .toLowerCase();
  return `${sanitizedName}-v${versionNumber}.${format}`;
};
