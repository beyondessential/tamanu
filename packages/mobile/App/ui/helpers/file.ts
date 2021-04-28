import RNFS from 'react-native-fs';

export const getFileInDocumentsPath = (fileName: string) =>
  `file://${RNFS.DocumentDirectoryPath}/${fileName}`;

export const saveFile = async (fileData, fileName) =>
  RNFS.writeFile(
    `${RNFS.DocumentDirectoryPath}/${fileName}`,
    fileData,
    'base64'
  );
