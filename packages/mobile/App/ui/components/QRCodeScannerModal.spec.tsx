import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { QRCodeScannerModal } from './QRCodeScannerModal';

const mockPermission = {
  hasPermission: false,
  requestPermission: jest.fn(),
};
let mockOnBarcodeScanned: (barcodes: { rawValue?: string }[]) => void;

jest.mock('~/ui/contexts/TranslationContext', () => ({
  useTranslation: () => ({ getTranslation: (_id: string, fallback: string) => fallback }),
}));

jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: () => ({ id: 'back' }),
  useCameraPermission: () => mockPermission,
}));

jest.mock('react-native-vision-camera-barcode-scanner', () => ({
  useBarcodeScannerOutput: ({ onBarcodeScanned }) => {
    mockOnBarcodeScanned = onBarcodeScanned;
    return {};
  },
}));

describe('<QRCodeScannerModal />', () => {
  beforeEach(() => {
    mockPermission.hasPermission = false;
    mockPermission.requestPermission.mockReset().mockResolvedValue(false);
  });

  it('asks for camera access when it opens without it', async () => {
    await render(<QRCodeScannerModal onClose={jest.fn()} onScan={jest.fn()} />);
    expect(mockPermission.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('explains and links to settings when camera access is denied', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const { findByText, getByText } = await render(
      <QRCodeScannerModal onClose={jest.fn()} onScan={jest.fn()} />,
    );
    expect(await findByText('Tamanu needs camera access to scan QR codes.')).toBeTruthy();
    await fireEvent.press(getByText('Open settings'));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('shows the scanner without asking again when access is already granted', async () => {
    mockPermission.hasPermission = true;
    const { getByText, queryByText } = await render(
      <QRCodeScannerModal onClose={jest.fn()} onScan={jest.fn()} />,
    );
    expect(mockPermission.requestPermission).not.toHaveBeenCalled();
    expect(getByText("Point the camera at the patient's QR code")).toBeTruthy();
    expect(queryByText('Tamanu needs camera access to scan QR codes.')).toBeNull();
  });

  it('reports only the first code it reads', async () => {
    mockPermission.hasPermission = true;
    const onScan = jest.fn();
    await render(<QRCodeScannerModal onClose={jest.fn()} onScan={onScan} />);
    await act(() => {
      mockOnBarcodeScanned([{ rawValue: undefined }, { rawValue: 'TMN284711' }]);
      mockOnBarcodeScanned([{ rawValue: 'TMN999999' }]);
    });
    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('TMN284711');
  });

  it('closes from the close button', async () => {
    mockPermission.hasPermission = true;
    const onClose = jest.fn();
    const { getByLabelText } = await render(
      <QRCodeScannerModal onClose={onClose} onScan={jest.fn()} />,
    );
    await fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
