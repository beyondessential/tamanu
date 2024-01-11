export const sanitizeFileName = fileName => {
  return fileName
    .replace(/CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9]/g, 'download') // replace windows reserved filenames
    .replace(/[-<>:"\/\\|?*\s]+/g, '-') // replace any consecutive windows reserved characters
    .trim('-'); // prevent leading or trailing hyphen
};
