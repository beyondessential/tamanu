import RNFS from 'react-native-fs';

export const clearPersistedSyncSessionRecords = async (): Promise<void> => {
  const directory = `${RNFS.DocumentDirectoryPath}/syncSessions`;
  if (await RNFS.exists(directory)) {
    await RNFS.unlink(directory);
  }
};
