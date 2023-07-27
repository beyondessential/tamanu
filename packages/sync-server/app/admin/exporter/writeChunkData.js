import fs from 'fs';

export async function writeChunkData(fileName, start, end, res) {
  if (isNaN(start) || isNaN(end) || start >= end) {
    res.status(400).send('Invalid start or end parameter.');
    return;
  }

  // Get the file's size using fs.promises.stat
  const { size } = await fs.promises.stat(fileName);

  // Validate start and end range
  if (end > size) {
    res.status(400).send('End is greater than the file size.');
    return;
  }

  res.set('Content-Type', 'application/octet-stream'); // Set the appropriate content type for your file
  res.set('Content-Disposition', `attachment; filename=${fileName}`);
  const fileStream = fs.createReadStream(fileName, { start, end });

  // Pipe the file stream to the response stream
  fileStream.pipe(res);
}
