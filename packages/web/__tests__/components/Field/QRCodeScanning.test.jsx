import * as React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@zxing/library';
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

const { zxingDecode } = vi.hoisted(() => ({ zxingDecode: vi.fn() }));

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decode = zxingDecode;
  },
}));

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

describe('repeated scans of one invalid QR code', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.BarcodeDetector;
    zxingDecode.mockReset();
    vi.mocked(notifyError).mockClear();
  });

  it('shows one toast when detections are slower than the scan interval', async () => {
    const pendingDetections = [];
    window.BarcodeDetector = class {
      detect = () =>
        new Promise(resolve => {
          pendingDetections.push(resolve);
        });
    };
    renderField();

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));
    await act(async () => vi.advanceTimersByTime(2500));
    await act(async () =>
      pendingDetections.forEach(resolve => resolve([{ rawValue: SCANNED_VALUE }])),
    );

    expect(notifyError).toHaveBeenCalledTimes(1);
  });

  it('shows one toast when the camera has been open for several scans without BarcodeDetector', async () => {
    let isCodeInView = false;
    zxingDecode.mockImplementation(() => {
      if (!isCodeInView) throw new NotFoundException();
      return { getText: () => SCANNED_VALUE };
    });
    renderField();

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));
    await act(async () => vi.advanceTimersByTime(2500));
    isCodeInView = true;
    await act(async () => vi.advanceTimersByTime(2500));

    expect(notifyError).toHaveBeenCalledTimes(1);
  });
});

describe('zxing decode errors', () => {
  let consoleError;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleError.mockRestore();
    zxingDecode.mockReset();
  });

  it('keeps scanning quietly while frames hold no QR code', async () => {
    zxingDecode.mockImplementation(() => {
      throw new NotFoundException();
    });
    renderField();

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));
    await act(() => vi.advanceTimersByTimeAsync(1500));

    expect(zxingDecode).toHaveBeenCalledTimes(3);
    expect(consoleError).not.toHaveBeenCalledWith('Barcode detection failed', expect.anything());
  });

  it('logs an error that is not about the frame', async () => {
    const decodeError = new Error('Canvas unavailable');
    zxingDecode.mockImplementation(() => {
      throw decodeError;
    });
    renderField();

    await userEvent.click(screen.getByTestId('qr-scanner-button-code'));
    await act(async () => vi.advanceTimersByTime(500));

    expect(consoleError).toHaveBeenCalledWith('Barcode detection failed', decodeError);
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
