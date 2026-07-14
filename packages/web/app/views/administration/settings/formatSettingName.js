import { capitalize, startCase } from 'es-toolkit/compat';

// The display name of a schema node: its declared name, or one derived from
// its key ("maxPageSize" -> "Max page size"). Shared by the editor rows and
// the search filter so matching and rendering always agree on the name.
export const formatSettingName = (name, path) => name ?? capitalize(startCase(path));
