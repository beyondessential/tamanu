import bcrypt from 'react-native-bcrypt';

const SALT_ROUNDS = 10;

export const hash = (content) => new Promise((resolve, reject) => {
  bcrypt.hash(content, SALT_ROUNDS, (err, result) => {
    if(err) {
      reject(err);
    } else {
      resolve(result);
    }
  });
});

export const compare = (content, hash) => new Promise((resolve, reject) => {
  bcrypt.compare(content, hash, (err, result) => {
    if(err) {
      reject(err);
    } else {
      resolve(result);
    }
  });
});

