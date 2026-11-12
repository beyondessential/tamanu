import React, { type ReactElement, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import {
  type TargetBarcodeFormat,
  useBarcodeScannerOutput,
} from 'react-native-vision-camera-barcode-scanner';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useOnForeground } from '~/ui/hooks/useOnForeground';
import { Button } from './Button';
import { CrossIcon } from './Icons';
import { TranslatedText } from './Translations/TranslatedText';
import { CenterView, RowView, StyledSafeAreaView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

const QR_CODE_FORMATS: TargetBarcodeFormat[] = ['qr-code'];

const styles = StyleSheet.create({
  scanner: {
    flex: 1,
  },
  reticle: {
    width: 200,
    height: 200,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: theme.colors.WHITE,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  hint: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});

const ScannerCamera = ({ onScan }: { onScan: (rawValue: string) => void }): ReactElement => {
  const device = useCameraDevice('back');
  const isForeground = useOnForeground();
  const hasScannedRef = useRef(false);
  const output = useBarcodeScannerOutput({
    barcodeFormats: QR_CODE_FORMATS,
    onBarcodeScanned: barcodes => {
      const rawValue = barcodes.find(barcode => barcode.rawValue)?.rawValue;
      if (!rawValue || hasScannedRef.current) return;
      hasScannedRef.current = true;
      onScan(rawValue);
    },
    onError: error => console.error('QR code scanning failed', error),
  });

  return (
    <View style={styles.scanner}>
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          isActive={isForeground}
          device={device}
          outputs={[output]}
        />
      )}
      <CenterView flex={1}>
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </CenterView>
      <StyledText fontSize={14} color={theme.colors.WHITE} style={styles.hint}>
        <TranslatedText
          stringId="patient.search.qrScanner.instruction"
          fallback="Point the camera at the patient's QR code"
        />
      </StyledText>
    </View>
  );
};

const CameraAccessDenied = (): ReactElement => (
  <CenterView flex={1} paddingLeft={32} paddingRight={32}>
    <StyledText fontSize={15} color={theme.colors.WHITE} textAlign="center" marginBottom={16}>
      <TranslatedText
        stringId="patient.search.qrScanner.cameraAccessDenied"
        fallback="Tamanu needs camera access to scan QR codes."
      />
    </StyledText>
    <Button
      width={160}
      backgroundColor={theme.colors.PRIMARY_MAIN}
      textColor={theme.colors.WHITE}
      onPress={() => Linking.openSettings()}
      buttonText={
        <TranslatedText stringId="general.action.openSettings" fallback="Open settings" />
      }
    />
  </CenterView>
);

interface QRCodeScannerModalProps {
  onClose: () => void;
  onScan: (rawValue: string) => void;
}

export const QRCodeScannerModal = ({ onClose, onScan }: QRCodeScannerModalProps): ReactElement => {
  const { getTranslation } = useTranslation();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(hasPermission);

  useEffect(() => {
    if (hasRequestedPermission) return;
    requestPermission()
      .catch(error => console.error('Camera permission request failed', error))
      .finally(() => setHasRequestedPermission(true));
  }, [hasRequestedPermission, requestPermission]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <StyledSafeAreaView flex={1} background={theme.colors.BLACK}>
        <RowView justifyContent="space-between" alignItems="center" padding={16}>
          <StyledText fontSize={16} fontWeight={500} color={theme.colors.WHITE}>
            <TranslatedText stringId="modal.qrScanner.title" fallback="Scan QR code" />
          </StyledText>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={getTranslation('general.action.close', 'Close')}
          >
            <CrossIcon size={18} />
          </Pressable>
        </RowView>
        {hasPermission && <ScannerCamera onScan={onScan} />}
        {!hasPermission && hasRequestedPermission && <CameraAccessDenied />}
      </StyledSafeAreaView>
    </Modal>
  );
};
