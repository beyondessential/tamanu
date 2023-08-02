import { splitIds } from './utilities';

const prehashed12345Password = '$2b$10$HViO/gGVnhXT/pKmWoleBe6kRIiN0vXnNKGvgdRq5i/PoRUAsO/xG';

const buildUser = u => ({
  ...u,
  displayId: '12345',
  displayName: u.name,
  email: `${u.id}@xyz.com`,
  password: prehashed12345Password,
});
export const USERS = splitIds(`
  Dr Adam Smith
  Dr Wendy Brown
  Dr Jane Goodall
  Dr Will Smith
`).map(buildUser);
