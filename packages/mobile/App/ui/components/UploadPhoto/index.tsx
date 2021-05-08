import React, { useState, useCallback } from 'react';
import { Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';
import { useBackend } from '~/ui/hooks';
import { StyledView, StyledImage } from '/styled/common';
import {
  getImageFromPhotoLibrary,
  resizeImage,
  imageToBase64URI
} from '/helpers/image';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';

const IMAGE_RESIZE_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 20
};

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

const ImageActionButton = ({ onPress, label, marginTop }) => (
  <Button
    buttonText={label}
    onPress={onPress}
    margin={5}
    marginTop={marginTop}
  />
);

const UploadedImage = ({ imageData }: UploadedImageProps) => (
  <StyledView justifyContent='center' alignItems='center'>
    <StyledImage
      width='100%'
      height={IMAGE_WIDTH}
      source={{ uri: imageToBase64URI(imageData) }}
      resizeMode='cover'
    />
  </StyledView>
);

const UploadPhotoComponent = ({
  onPressChoosePhoto,
  onPressRemovePhoto,
  imageData,
  errorMessage
}: UploadPhotoComponent) => (
  <StyledView marginTop={5}>
    {imageData && <UploadedImage imageData={imageData} />}
    {!imageData && errorMessage && (
      <Text>{`Error loading photo: ${errorMessage}`}</Text>
    )}
    <StyledView justifyContent='space-between' marginLeft={-10}>
      <ImageActionButton
        onPress={onPressChoosePhoto}
        label={!imageData ? 'Add photo' : 'Change photo'}
        marginTop={5}
      />
      {imageData && (
        <ImageActionButton
          onPress={onPressRemovePhoto}
          label='Remove photo'
          marginTop={0}
        />
      )}
    </StyledView>
  </StyledView>
);

export const UploadPhoto = React.memo(({ onChange, value }: PhotoProps) => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const { models } = useBackend();

  const removePhotoCallback = useCallback(async () => {
    onChange(null);
    setImageData(null);
    if (value) {
      await models.Attachment.delete(value);
    }
  }, []);

  const addPhotoCallback = useCallback(async () => {
    let image: { data: string };
    try {
      image = await getImageFromPhotoLibrary();
      if (!image) {
        // in case user cancel selecting image
        return;
      }
    } catch (error) {
      await removePhotoCallback();
      setErrorMessage(error.message);
      return;
    }

    // Remove previous photo when selecting a new photo
    if (value) {
      await models.Attachment.delete(value);
    }

    // resized images provided with base64 data is only stored in app cache
    const { path, size } = await resizeImage(
      imageToBase64URI(image.data),
      IMAGE_RESIZE_OPTIONS
    );
    const data = await RNFS.readFile(`file://${path}`, 'base64');
    const { id } = await models.Attachment.createAndSaveOne({
      data,
      size,
      type: 'jpeg'
    });
    onChange(id);
    setImageData(image.data);
  }, []);

  return (
    <UploadPhotoComponent
      imageData={imageData}
      errorMessage={errorMessage}
      onPressChoosePhoto={addPhotoCallback}
      onPressRemovePhoto={removePhotoCallback}
    />
  );
});
