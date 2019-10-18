import { splitIds } from './splitIds';

const buildUser = u => ({
  ...u,
  displayName: u.name,
  email: `${u._id}@xyz.com`,
});
export const USERS = splitIds(`
  Dr Adam Smith
  Dr Wendy Brown
  Dr Jane Goodall
  Dr Will Smith
`).map(buildUser);
