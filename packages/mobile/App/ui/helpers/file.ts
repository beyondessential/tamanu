import RNFS from 'react-native-fs';

export const saveFileInDocuments = async (fileData: string, fileName: string) => {
  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, fileData, 'base64');
  return path;
};

export const deleteFileInDocuments = async (fileName: string) => {
  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.unlink(path);
};
