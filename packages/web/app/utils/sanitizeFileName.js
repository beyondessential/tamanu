export const sanitizeFileName = fileName => {
  return filename.replace(/[-<>:"\/\\|?*\s]+/g, '-');
};
