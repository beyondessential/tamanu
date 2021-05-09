import RNFS from 'react-native-fs';

export const readFileInDocuments = async (
  filePath: string,
  encode = 'base64'
) => {
  return RNFS.readFile(`file://${filePath}`, encode);
};

export const saveFileInDocuments = async (
  fileData: string,
  fileName: string
) => {
  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, fileData, 'base64');
  return path;
};

export const deleteFileInDocuments = async (filePath: string) => {
  await RNFS.unlink(filePath);
};
