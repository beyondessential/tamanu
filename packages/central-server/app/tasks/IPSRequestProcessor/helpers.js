import QRCode from 'qrcode';

export async function QRCodeToFileAsync(path, text, options) {
  const promise = await new Promise(resolve => {
    QRCode.toFile(path, text, options, () => {
      resolve();
    });
  }).catch(err => {
    throw err;
  });

  return promise;
}
