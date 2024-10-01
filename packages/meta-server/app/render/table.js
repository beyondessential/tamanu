import { upperFirst } from 'lodash';
import { sanitise } from './sanitise';

const makeTable = (definition, data) => {
  const headers = definition.map(({ key }) => `<th>${sanitise(upperFirst(key))}</th>`).join('\n');
  const rows = data
    .map(row =>
      definition
        .map(
          ({ key, getter = () => sanitise(row[key] || '') }) => `<td>${getter(row[key], row)}</td>`,
        )
        .join('\n'),
    )
    .map(row => `<tr>${row}</tr>`)
    .join('\n');
  return `
    <table>
      <thead>
        <tr>
          ${headers}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

export const makeTableResponse = (definition, data, { title = null } = {}) => {
  const titleHtml = title ? `<title>${title}</title>` : '';
  const table = makeTable(definition, data);
  return `
    <!doctype html>
    <html>
      <head>${titleHtml}</head>
      <body>
        ${table}
      </body>
    </html>
  `;
};
