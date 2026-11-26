import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsContext } from '@tamanu/ui-components';
import { Field } from '../../../app/components/Field';
import { QRCodeTextField } from '../../../app/components/Field/QRCodeTextField';
import { IdInput } from '../../../app/components/Field/IdField';
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
const TOUCHED_PROBE = 'touched-probe';

const renderField = fieldProps =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider
      value={{
        getSetting: key => (key === 'fields.displayId.pattern' ? '^[A-Z]{4}\\d{6}$' : undefined),
      }}
    >
      <Formik initialValues={{ code: '' }} initialStatus={{}} onSubmit={() => {}}>
        {({ values, touched }) => (
          <>
            <Field name="code" component={QRCodeTextField} {...fieldProps} />
            <div data-testid={VALUE_PROBE}>{values.code}</div>
            <div data-testid={TOUCHED_PROBE}>{String(Boolean(touched.code))}</div>
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

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(screen.getByTestId(VALUE_PROBE).textContent).toBe('');
  });

  it('fills and touches the field with any scan when the display ID pattern is not required', async () => {
    renderField({ matchDisplayIdPattern: false });

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));

    await waitFor(() => expect(screen.getByTestId(VALUE_PROBE).textContent).toBe(SCANNED_VALUE));
    expect(screen.getByTestId(TOUCHED_PROBE).textContent).toBe('true');
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('accepts a long scan when the display ID pattern is not required', async () => {
    scannedValue = 'x'.repeat(80);
    renderField({ matchDisplayIdPattern: false });

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));

    await waitFor(() => expect(screen.getByTestId(VALUE_PROBE).textContent).toBe(scannedValue));
  });

  it('rejects a scan longer than a free text field can store', async () => {
    scannedValue = 'x'.repeat(256);
    renderField({ matchDisplayIdPattern: false });

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(screen.getByTestId(VALUE_PROBE).textContent).toBe('');
  });
});

describe('IdInput', () => {
  beforeEach(() => {
    window.BarcodeDetector = class {
      detect = async () => [{ rawValue: scannedValue }];
    };
  });

  afterEach(() => {
    delete window.BarcodeDetector;
    vi.mocked(notifyError).mockClear();
  });

  const renderIdInput = onChange =>
    renderElementWithTranslatedText(
      <SettingsContext.Provider
        value={{
          getSetting: key => (key === 'fields.displayId.pattern' ? '^[A-Z]{4}\\d{6}$' : undefined),
        }}
      >
        <IdInput name="displayId" value="GENR000001" onChange={onChange} regenerateId={vi.fn()} />
      </SettingsContext.Provider>,
    );

  it('replaces the generated display ID with a scanned one', async () => {
    scannedValue = 'SCAN123456';
    const onChange = vi.fn();
    renderIdInput(onChange);

    await userEvent.click(screen.getByTestId('qr-scanner-button-displayId'));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ target: { value: 'SCAN123456', name: 'displayId' } }),
    );
  });

  it('keeps the generated display ID when the scan does not match the pattern', async () => {
    scannedValue = SCANNED_VALUE;
    const onChange = vi.fn();
    renderIdInput(onChange);

    await userEvent.click(screen.getByTestId('qr-scanner-button-displayId'));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });
});
