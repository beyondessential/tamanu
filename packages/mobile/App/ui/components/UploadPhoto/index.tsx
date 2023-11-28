import React, { useState, useCallback } from 'react';
import { Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';
import { Popup } from 'popup-ui';
import { useBackend } from '~/ui/hooks';
import { StyledView, StyledImage } from '/styled/common';
import { getImageFromPhotoLibrary, resizeImage, imageToBase64URI } from '/helpers/image';
import { deleteFileInDocuments } from '/helpers/file';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';

const IMAGE_RESIZE_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 20,
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
  loading: boolean;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

const ImageActionButton = ({ onPress, label, marginTop }) => (
  <Button buttonText={label} onPress={onPress} margin={5} marginTop={marginTop} />
);

const UploadedImage = ({ imageData }: UploadedImageProps) => (
  <StyledView justifyContent="center" alignItems="center">
    <StyledImage
      width="100%"
      height={IMAGE_WIDTH}
      source={{ uri: imageToBase64URI(imageData) }}
      resizeMode="cover"
    />
  </StyledView>
);

const LoadingPlaceholder = () => (
  <StyledView justifyContent="center" alignItems="center" width="100%" height={IMAGE_WIDTH}>
    <Text>Loading image...</Text>
  </StyledView>
);

const UploadPhotoComponent = ({
  onPressChoosePhoto,
  onPressRemovePhoto,
  imageData,
  errorMessage,
  loading,
}: UploadPhotoComponent) => (
  <StyledView marginTop={5}>
    {loading && <LoadingPlaceholder />}
    {imageData && <UploadedImage imageData={imageData} />}
    {!imageData && errorMessage && <Text>{`Error loading image: ${errorMessage}`}</Text>}
    <StyledView justifyContent="space-between" marginLeft={-10}>
      <ImageActionButton
        onPress={onPressChoosePhoto}
        label={!imageData ? 'Add photo' : 'Change photo'}
        marginTop={5}
      />
      {imageData && (
        <ImageActionButton onPress={onPressRemovePhoto} label="Remove photo" marginTop={0} />
      )}
    </StyledView>
  </StyledView>
);

export const UploadPhoto = React.memo(({ onChange, value }: PhotoProps) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const { models, centralServer } = useBackend();

  const removeAttachment = useCallback(async (value, imagePath) => {
    if (value) {
      await models.Attachment.delete(value);
    }
    if (imagePath) {
      await deleteFileInDocuments(imagePath);
      setImagePath(null);
    }
  }, []);

  const removePhotoCallback = useCallback(async () => {
    onChange(null);
    setImageData(null);
    await removeAttachment(value, imagePath);
  }, [value, imagePath]);

  const addPhotoCallback = useCallback(async () => {
    let image: { data: string; uri: string };
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

    setImageData(null);
    setLoading(true);

    // image-picker produces quite expensive files so
    // always delete them straight away to save storage
    await deleteFileInDocuments(image.uri.replace('file://', ''));

    // Remove previous photo when selecting a new photo
    await removeAttachment(value, imagePath);

    const { path, size } = await resizeImage(imageToBase64URI(image.data), {
      outputPath: RNFS.DocumentDirectoryPath,
      rotation: 0,
      ...IMAGE_RESIZE_OPTIONS,
    });

    // Make sure the sync server has enough space to store a new attachment
    const { canUploadAttachment } = await centralServer.get('health/canUploadAttachment', {});

    if (!canUploadAttachment) {
      Popup.show({
        type: 'Warning',
        title: 'Not enough storage space to upload file',
        textBody: 'The server has limited storage space remaining. To protect performance, you are currently unable to upload images. Please speak to your system administrator to increase your central server hard drive space.',
        callback: (): void => Popup.hide(),
      });
      return;
    }

    const { id } = await models.Attachment.createAndSaveOne({
      filePath: path,
      size,
      type: 'image/jpeg',
    });

    onChange(id);
    setImagePath(path);
    setImageData(image.data);
    setLoading(false);
  }, [value, imagePath]);

  return (
    <UploadPhotoComponent
      imageData={imageData}
      errorMessage={errorMessage}
      onPressChoosePhoto={addPhotoCallback}
      onPressRemovePhoto={removePhotoCallback}
      loading={loading}
    />
  );
});
