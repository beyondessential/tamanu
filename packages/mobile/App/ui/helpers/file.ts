import RNFS from 'react-native-fs';

export const readFileInDocuments = async (filePath: string, encode = 'base64') => {
  return RNFS.readFile(`file://${filePath}`, encode);
};

export const saveFileInDocuments = async (
  fileData: string,
  fileName: string,
  filePath?: string,
): Promise<string> => {
  let path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  if (filePath) {
    RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/${filePath}`);
    path = `${RNFS.DocumentDirectoryPath}/${filePath}/${fileName}`;
  }
  await RNFS.writeFile(path, fileData, 'base64');
  return path;
};

export const deleteFileInDocuments = async (filePath: string) => {
  if (RNFS.exists(filePath)) {
    await RNFS.unlink(filePath);
    console.log(`File path ${filePath} deleted`);
  }
};
