import { splitIds } from './splitIds';

const buildProcedure = ({ _id, name: nameAndCode }) => {
  const [name, code] = nameAndCode.split(/\t/);
  return { _id, name, code };
};
export const PROCEDURE_TYPES = splitIds(`
  Test procedure 1\t101
  Test procedure 2\t201
  Another procedure\t400
`).map(buildProcedure);
