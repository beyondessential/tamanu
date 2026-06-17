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

  // Inject a fake render so we can capture the rendered element without actually
  // producing a PDF (and without mocking the @react-pdf/renderer module).
  let render;
  beforeEach(() => {
    render = jest.fn().mockResolvedValue(undefined);
  });

  it('passes the request locale through to the letter render', async () => {
    await makePatientLetter(
      makeFakeReq(),
      {
        id: 'test-letter',
        facilityId: 'facility-a',
        title: 'Title',
        body: 'Body',
      },
      { render },
    );

    expect(render).toHaveBeenCalledTimes(1);
    const [element] = render.mock.calls[0];
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });

  it('lets the dateTimeLocale setting take precedence in the rendered context', async () => {
    await makePatientLetter(
      makeFakeReq({ settings: { dateTimeLocale: 'en-GB' } }),
      {
        id: 'test-letter',
        facilityId: 'facility-a',
        title: 'Title',
        body: 'Body',
      },
      { render },
    );

    const [element] = render.mock.calls[0];
    // The setting itself reaches the render via getSetting; the prop carries
    // the browser locale, and withDateTimeContext prefers the setting.
    expect(element.props.getSetting('dateTimeLocale')).toBe('en-GB');
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });
});
