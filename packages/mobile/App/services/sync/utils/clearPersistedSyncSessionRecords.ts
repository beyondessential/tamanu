import { readFileInDocuments, deleteFileInDocuments } from '../../../ui/helpers/file';

const readBatchString = async (fileName): Promise<string> => {
  try {
    return readFileInDocuments(fileName, 'utf8');
  } catch (e) {
    //ignore
  }

  return '';
};

export const clearPersistedSyncSessionRecords = async (): Promise<void> => {
  let currentBatchIndex = 0;
  while (true) {
    const fileName = `batch${currentBatchIndex}.json`;
    const batchString = await readBatchString(fileName);

    if (!batchString) {
      break;
    }

    deleteFileInDocuments(fileName);

    currentBatchIndex++;
  }
};
