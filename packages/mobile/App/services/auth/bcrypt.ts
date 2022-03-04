import bcrypt from 'react-native-bcrypt';

const SALT_ROUNDS = 10;

export const hash = (content: string): Promise<string> =>
  new Promise((resolve, reject) => {
    bcrypt.hash(content, SALT_ROUNDS, (err: Error, result?: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

export const compare = (content: string, hash: string): Promise<boolean> =>
  new Promise((resolve, reject) => {
    bcrypt.compare(content, hash, (err: Error, result?: boolean) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

