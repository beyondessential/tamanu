import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsContext } from '@tamanu/ui-components';
import { Field, QRCodeTextField } from '../../../app/components/Field';
import { notifyError } from '../../../app/utils';
import { renderElementWithTranslatedText } from '../../helpers';

vi.mock('../../../app/components/WebcamCaptureModal', async importOriginal => {
  const actual = await importOriginal();
  const { useEffect } = await import('react');
  return {
    ...actual,
    WebcamCaptureModal: ({ open, webcamRef, onCameraStatusChange }) => {
      useEffect(() => {
        if (!open) return;
        webcamRef.current = { video: { readyState: 4, videoWidth: 640 } };
        onCameraStatusChange(actual.CAMERA_STATUS.READY);
      }, [open, webcamRef, onCameraStatusChange]);
      return null;
    },
  };
});

vi.mock('../../../app/utils', async importOriginal => ({
  ...(await importOriginal()),
  notifyError: vi.fn(),
}));

const SCANNED_VALUE = 'screening-123';
let scannedValue;
const VALUE_PROBE = 'value-probe';

const renderField = fieldProps =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider
      value={{
        getSetting: key => (key === 'fields.displayId.pattern' ? '^[A-Z]{4}\\d{6}$' : undefined),
      }}
    >
      <Formik initialValues={{ code: '' }} initialStatus={{}} onSubmit={() => {}}>
        {({ values }) => (
          <>
            <Field name="code" component={QRCodeTextField} {...fieldProps} />
            <div data-testid={VALUE_PROBE}>{values.code}</div>
          </>
        )}
      </Formik>
    </SettingsContext.Provider>,
  );

describe('QRCodeTextField', () => {
  beforeEach(() => {
    scannedValue = SCANNED_VALUE;
    window.BarcodeDetector = class {
      detect = async () => [{ rawValue: ` ${scannedValue} ` }];
    };
  });

  afterEach(() => {
    delete window.BarcodeDetector;
    vi.mocked(notifyError).mockClear();
  });

  it('rejects a scan that does not match the display ID pattern', async () => {
    renderField();

    await userEvent.click(screen.getByTestId('qr-scanner-button'));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(screen.getByTestId(VALUE_PROBE).textContent).toBe('');
  });

  it('fills the field with any scan when the display ID pattern is not required', async () => {
    renderField({ matchDisplayIdPattern: false });

    await userEvent.click(screen.getByTestId('qr-scanner-button'));

    await waitFor(() => expect(screen.getByTestId(VALUE_PROBE).textContent).toBe(SCANNED_VALUE));
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('accepts a long scan when the display ID pattern is not required', async () => {
    scannedValue = 'x'.repeat(80);
    renderField({ matchDisplayIdPattern: false });

    await userEvent.click(screen.getByTestId('qr-scanner-button'));

    await waitFor(() => expect(screen.getByTestId(VALUE_PROBE).textContent).toBe(scannedValue));
  });
});
