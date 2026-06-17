import ReactPDF from '@react-pdf/renderer';

import { makePatientLetter } from '../../app/utils/makePatientLetter';

jest.mock('@react-pdf/renderer', () => {
  const actual = jest.requireActual('@react-pdf/renderer');
  const actualDefault = actual.default ?? actual;
  const render = jest.fn().mockResolvedValue(undefined);
  return {
    ...actual,
    __esModule: true,
    render,
    default: { ...actualDefault, render },
  };
});

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

  beforeEach(() => {
    ReactPDF.render.mockClear();
  });

  it('passes the request locale through to the letter render', async () => {
    await makePatientLetter(makeFakeReq(), {
      id: 'test-letter',
      facilityId: 'facility-a',
      title: 'Title',
      body: 'Body',
    });

    expect(ReactPDF.render).toHaveBeenCalledTimes(1);
    const [element] = ReactPDF.render.mock.calls[0];
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });

  it('lets the dateTimeLocale setting take precedence in the rendered context', async () => {
    await makePatientLetter(makeFakeReq({ settings: { dateTimeLocale: 'en-GB' } }), {
      id: 'test-letter',
      facilityId: 'facility-a',
      title: 'Title',
      body: 'Body',
    });

    const [element] = ReactPDF.render.mock.calls[0];
    // The setting itself reaches the render via getSetting; the prop carries
    // the browser locale, and withDateTimeContext prefers the setting.
    expect(element.props.getSetting('dateTimeLocale')).toBe('en-GB');
    expect(element.props.dateTimeLocale).toBe('fr-FR');
  });
});
