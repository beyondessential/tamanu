import React, { useRef, useState, useCallback } from 'react';
import { PanResponder, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '~/ui/components/Button';
import { StyledView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { useBackend } from '~/ui/hooks';
import { saveFileInDocuments } from '~/ui/helpers/file';

const SIGNATURE_WIDTH = Math.min(Dimensions.get('window').width - 40, 400);
const SIGNATURE_HEIGHT = 150;

interface SignatureFieldProps extends BaseInputProps {
  onChange: Function;
  value: string;
}

export const SignatureField = React.memo(({ onChange, value }: SignatureFieldProps) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const pathRef = useRef('');
  const { models, centralServer } = useBackend();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      const newPath = `M${locationX.toFixed(2)},${locationY.toFixed(2)}`;
      pathRef.current = newPath;
      setCurrentPath(newPath);
    },

    onPanResponderMove: (event) => {
      const { locationX, locationY } = event.nativeEvent;
      const newPath = `${pathRef.current} L${locationX.toFixed(2)},${locationY.toFixed(2)}`;
      pathRef.current = newPath;
      setCurrentPath(newPath);
    },

    onPanResponderRelease: () => {
      setPaths(prev => [...prev, pathRef.current]);
      setCurrentPath('');
      setHasSignature(true);
    },
  });

  const clearSignature = useCallback(() => {
    setPaths([]);
    setCurrentPath('');
    setHasSignature(false);
    onChange(null);
  }, [onChange]);

  const confirmSignature = useCallback(async () => {
    if (!hasSignature) return;

    try {
      // Create SVG string
      const allPaths = [...paths, currentPath].filter(Boolean);
      const svgString = `<svg width="${SIGNATURE_WIDTH}" height="${SIGNATURE_HEIGHT}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/>${allPaths.map(path => `<path d="${path}" stroke="#444444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;

      // Convert SVG to base64
      const base64Data = Buffer.from(svgString).toString('base64');

      // Check if central server has space (similar to photo upload)
      const { canUploadAttachment } = await centralServer.get('health/canUploadAttachment', {});
      
      if (!canUploadAttachment) {
        // Handle storage limit - could show error message
        return;
      }

      // Save signature to file (similar to photo upload pattern)
      const timestamp = new Date().getTime();
      const fileName = `signature-${timestamp}.svg`;
      const filePath = await saveFileInDocuments(base64Data, fileName);

      // Create attachment similar to photo upload
      const { id } = await models.Attachment.createAndSaveOne({
        filePath,
        type: 'image/svg+xml',
        size: base64Data.length,
      });

      onChange(id);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  }, [hasSignature, paths, currentPath, onChange, models, centralServer]);

  // If we have a saved signature (attachment ID), show a simple placeholder
  if (value && typeof value === 'string' && !value.startsWith('data:')) {
    return (
      <StyledView>
        <StyledView
          style={{
            width: SIGNATURE_WIDTH,
            height: SIGNATURE_HEIGHT,
            borderWidth: 2,
            borderColor: theme.colors.BORDER_COLOR,
            borderRadius: 3,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StyledText>Signature Captured</StyledText>
        </StyledView>
        <StyledView style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
          <Button
            onPress={clearSignature}
            buttonText="Clear"
            variant="outlined"
          />
        </StyledView>
      </StyledView>
    );
  }

  return (
    <StyledView>
      <StyledView
        style={{
          width: SIGNATURE_WIDTH,
          height: SIGNATURE_HEIGHT,
          borderWidth: 2,
          borderColor: theme.colors.BORDER_COLOR,
          borderRadius: 3,
          backgroundColor: 'white',
        }}
        {...panResponder.panHandlers}
      >
        <Svg width={SIGNATURE_WIDTH} height={SIGNATURE_HEIGHT}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke="#444444"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke="#444444"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </StyledView>
      <StyledView style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
        <Button
          onPress={clearSignature}
          buttonText="Clear"
          variant="outlined"
          disabled={!hasSignature}
        />
        <Button
          onPress={confirmSignature}
          buttonText="Confirm"
          variant="filled"
          disabled={!hasSignature}
        />
      </StyledView>
    </StyledView>
  );
});