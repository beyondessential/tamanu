import React, { useState, useCallback } from 'react';
import { Dimensions, Text } from 'react-native';
import { StyledView, StyledImage } from '/styled/common';
import { getImageFromPhotoLibrary } from '/helpers/image';
import { saveFileInDocuments } from '/helpers/file';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';

export interface PhotoProps extends BaseInputProps {
  onChange: Function;
  value: string;
}

interface UploadedImageProps {
  imagePath: string;
}

interface UploadPhotoComponent {
  onPressChoosePhoto: Function;
  onPressRemovePhoto: Function;
  imagePath: string;
  errorMessage?: string;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

const ImageActionButton = ({ onPress, label }) => (
  <Button buttonText={label} onPress={onPress} flex={1} margin={5} />
);

const UploadedImage = ({ imagePath }: UploadedImageProps) => (
  <StyledView flex={1} justifyContent="center" alignItems="center">
    <StyledImage
      width="100%"
      height={IMAGE_WIDTH}
      source={{ uri: `file://${imagePath}` }}
      resizeMode="cover"
    />
  </StyledView>
);

const UploadPhotoComponent = ({
  onPressChoosePhoto,
  onPressRemovePhoto,
  imagePath,
  errorMessage,
}: UploadPhotoComponent) => (
  <StyledView marginTop={5}>
    {imagePath && <UploadedImage imagePath={imagePath} />}
    {!imagePath && errorMessage && <Text>{`Error loading photo: ${errorMessage}`}</Text>}
    <StyledView justifyContent="space-between" flexDirection="row" flex={1} marginLeft={-10}>
      <ImageActionButton
        onPress={onPressChoosePhoto}
        label={!imagePath ? 'Add photo' : 'Change photo'}
      />
      {imagePath && <ImageActionButton onPress={onPressRemovePhoto} label="Remove photo" />}
    </StyledView>
  </StyledView>
);

export const UploadPhoto = React.memo(({ onChange, value }: PhotoProps) => {
  const [errorMessage, setErrorMessage] = useState(null);

  const addPhotoCallback = useCallback(async () => {
    let image: { data: string };
    try {
      image = await getImageFromPhotoLibrary();
      if (!image) {
        // in case user cancel selecting image
        return;
      }
    } catch (error) {
      onChange(null);
      setErrorMessage(error.message);
      return;
    }

    const time = new Date().getTime();
    const fileName = `${time}-photo.jpg`;

    const filePath = await saveFileInDocuments(image.data, fileName);
    onChange(filePath);
  }, []);

  const removePhotoCallback = useCallback(() => onChange(null), []);

  return (
    <UploadPhotoComponent
      imagePath={value}
      errorMessage={errorMessage}
      onPressChoosePhoto={addPhotoCallback}
      onPressRemovePhoto={removePhotoCallback}
    />
  );
});
