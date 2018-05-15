import Promise from 'bluebird';
import nano from 'nano';

const dbHost = 'localhost';
const dbPort = 5984;
const dbUser = 'admin';
const dbPassword = 'password';
const configDB = nano(`http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/config`);
const patientDB = nano(`http://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/patient`);

Promise.promisifyAll(patientDB);
module.exports = { configDB, patientDB };
