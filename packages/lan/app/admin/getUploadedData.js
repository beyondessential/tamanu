import multiparty from 'multiparty';

async function getMultipartData(req) {
  const form = new multiparty.Form();
  
  return new Promise((resolve, reject) => {
    form.parse(req, function(err, fields, files) {
      if(err) {
        reject(err);
      } else {
        const {
          jsonData,
          ...otherFields
        } = fields;

        const parsedData = jsonData ? JSON.parse(jsonData) : {};

        const fileInfo = files.file
          ? { file: files.file[0].path, deleteFileAfterImport: true }
          : { };
          
        resolve({ 
          ...parsedData, 
          ...otherFields, 
          ...fileInfo,
        });
      }
    });
  });
}

export async function getUploadedData(req) {
  const contentType = (req.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  switch(contentType) {
    case 'multipart/form-data':
      return getMultipartData(req);
    case 'application/json':
      return { ...req.body };
    default:
      throw new Error(`Couldn't understand content type ${contentType}`);
  }
}

