import React, { useState, useCallback } from 'react';
import { Dimensions, Text } from 'react-native';
import { StyledView, StyledImage } from '/styled/common';
import {
  getImageFromPhotoLibrary,
  getImageSourceFromData
} from '/helpers/image';
import { saveFile } from '/helpers/file';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';

export interface PhotoProps extends BaseInputProps {
  onChange: Function;
  value: string;
}

interface UploadedImageProps {
  imageData: string;
}

interface UploadPhotoComponent {
  onPressChoosePhoto: Function;
  onPressRemovePhoto: Function;
  imageData: string;
  errorMessage?: string;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

const ImageActionButton = ({ onPress, label }) => (
  <Button buttonText={label} onPress={onPress} flex={1} margin={5} />
);

const UploadedImage = ({ imageData }: UploadedImageProps) => (
  <StyledView
    flex={1}
    justifyContent="center"
    alignItems="center"
  >
    <StyledImage
      width="100%"
      height={IMAGE_WIDTH}
      source={getImageSourceFromData(imageData)}
      resizeMode="cover"
    />
  </StyledView>
);

const UploadPhotoComponent = ({
  onPressChoosePhoto,
  onPressRemovePhoto,
  imageData,
  errorMessage
}: UploadPhotoComponent) => {
  return (
    <StyledView marginTop={5}>
      {imageData && <UploadedImage imageData={imageData} />}
      {!imageData && errorMessage && (
        <Text>{`Error loading photo: ${errorMessage}`}</Text>
      )}
      <StyledView
        justifyContent="space-between"
        flexDirection="row"
        flex={1}
        marginLeft={-10}
      >
        {
          <ImageActionButton
            onPress={onPressChoosePhoto}
            label={!imageData ? 'Add photo' : 'Change photo'}
          />
        }
        {imageData && (
          <ImageActionButton
            onPress={onPressRemovePhoto}
            label={'Remove photo'}
          />
        )}
      </StyledView>
    </StyledView>
  );
};

export const UploadPhoto = React.memo(({ onChange, value }: PhotoProps) => {
  const [errorMessage, setErrorMessage] = useState(null);

  const addPhotoCallback = useCallback(async () => {
    let image;
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

    await saveFile(image.data, fileName);
    onChange(fileName);
  }, []);

  const removePhotoCallback = useCallback(() => onChange(null), []);

  return (
    <UploadPhotoComponent
      imageData={value}
      errorMessage={errorMessage}
      onPressChoosePhoto={addPhotoCallback}
      onPressRemovePhoto={removePhotoCallback}
    />
  );
});
