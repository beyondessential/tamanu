import { createReadStream, createWriteStream, renameSync } from 'fs';

const getTempPath = () => `./ATTACH_TMP_${Math.random()}.tmp`;
const getFilePath = (id) => `./ATTACH_BIN_${id}.bin`;

const dummyAttachmentManager = {
  createReadStream: (id) => {
    const finalPath = getFilePath(id);
    return createReadStream(finalPath);
  },
  saveData: (id, requestStream) => {
    // write to temp path
    const tempPath = getTempPath();
    const finalPath = getFilePath(id);

    const writeStream = createWriteStream(tempPath, {
      flags: 'w',
      emitClose: true,
    });
    requestStream.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.once('close', () => {
        // move to actual destination
        resolve({
          bytesWritten: writeStream.bytesWritten,
          finalise: () => renameSync(tempPath, finalPath),
        });  
      });
      writeStream.once('error', err => {
        reject(err);
      });
    });
  },
};

export const attachmentManagerMiddleware = (req, res, next) => {
  req.attachmentManager = dummyAttachmentManager;
  next();
};
