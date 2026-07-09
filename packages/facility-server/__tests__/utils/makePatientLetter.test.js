import ReactPDF from '@react-pdf/renderer';

import { makePatientLetter } from '../../app/utils/makePatientLetter';

describe('makePatientLetter', () => {
  const makeFakeReq = ({ settings = {} } = {}) => ({
    getLocalisation: async () => ({}),
    models: { Asset: { findOne: async () => null } },
    language: 'en',
    dateTimeLocale: 'fr-FR',
    settings: {
      'facility-a': {
        getAll: async () => settings,
        get: async () => ({}),
      },
    },
  });

  // Spy on the shared ReactPDF instance so we can capture the rendered element without
  // producing a real PDF. spyOn mutates the imported object at runtime, so it reaches the
  // module-scoped `ReactPDF.render` call site regardless of mock-hoisting order.
  let render;
  beforeEach(() => {
    render = jest.spyOn(ReactPDF, 'render').mockResolvedValue(undefined);
  });
  afterEach(() => {
    render.mockRestore();
  });

  it('passes the request locale through to the letter render', async () => {
    await makePatientLetter(makeFakeReq(), {
      id: 'test-letter',
      facilityId: 'facility-a',
      title: 'Title',
      body: 'Body',
    });

    expect(render).toHaveBeenCalledTimes(1);
    const [element] = render.mock.calls[0];
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });

  it('lets the dateTimeLocale setting take precedence in the rendered context', async () => {
    await makePatientLetter(makeFakeReq({ settings: { dateTimeLocale: 'en-GB' } }), {
      id: 'test-letter',
      facilityId: 'facility-a',
      title: 'Title',
      body: 'Body',
    });

    const [element] = render.mock.calls[0];
    // The setting itself reaches the render via getSetting; the prop carries
    // the browser locale, and withDateTimeContext prefers the setting.
    expect(element.props.getSetting('dateTimeLocale')).toBe('en-GB');
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });
});
