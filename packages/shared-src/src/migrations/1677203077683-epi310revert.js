import { up as prevUp, down as prevDown } from './1677203077682-imagingRequestsMoveIdToDisplayId';

export async function up(query) {
  await prevDown(query);
}

export async function down(query) {
  await prevUp(query);
}
