export const getDirPath = (sessionId: string, recordType: string): string =>
  `syncSessions/${sessionId}/${recordType}`;

export const getFilePath = (sessionId: string, recordType: string, batchIndex: number): string => {
  const directory = getDirPath(sessionId, recordType);
  const fileName = `batch${batchIndex.toString().padStart(10, '0')}.json`;
  return `${directory}/${fileName}`;
};
