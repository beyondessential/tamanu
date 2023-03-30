import RNFS from 'react-native-fs';

export const makeDirectoryInDocuments = async (directoryPath: string): Promise<void> =>
  RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/${directoryPath}`);

export const readFileInDocuments = async (filePath: string, encode = 'base64') => {
  return RNFS.readFile(`file://${filePath}`, encode);
};

export const saveFileInDocuments = async (fileData: string, fileName: string): Promise<string> => {
  const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  await RNFS.writeFile(path, fileData, 'base64');
  return path;
};

export const deleteFileInDocuments = async (filePath: string) => {
  if (await RNFS.exists(filePath)) {
    await RNFS.unlink(filePath);
    console.log(`File path ${filePath} deleted`);
  }
};
