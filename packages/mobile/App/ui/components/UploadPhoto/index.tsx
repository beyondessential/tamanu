import React, { useCallback, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';
import { Popup } from 'popup-ui';
import { useBackend } from '~/ui/hooks';
import { StyledImage, StyledView, StyledText } from '/styled/common';
import {
  getImageFromPhotoLibrary,
  getImageFromCamera,
  imageToBase64URI,
  resizeImage,
} from '/helpers/image';
import { deleteFileInDocuments } from '/helpers/file';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { Button } from '~/ui/components/Button';
import { theme } from '~/ui/styled/theme';

const IMAGE_RESIZE_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 20,
};

const IMAGE_SOURCE_TYPES = {
  CAMERA: 'camera',
  LIBRARY: 'library',
};

export interface PhotoProps extends BaseInputProps {
  onChange: Function;
  value: string;
}

interface UploadedImageProps {
  imageData: string;
}

interface UploadPhotoComponentProps {
  onPressChoosePhoto: Function;
  onPressTakePhoto: Function;
  onPressRemovePhoto: Function;
  imageData: string;
  errorMessage?: string;
  loading: boolean;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

const ImageActionButton = ({ onPress, label, marginTop = 5, border = true }) => (
  <Button
    buttonText={label}
    onPress={onPress}
    textColor={theme.colors.PRIMARY_MAIN}
    borderColor={theme.colors.PRIMARY_MAIN}
    backgroundColor="transparent"
    margin={5}
    marginTop={marginTop}
    marginBottom={0}
    borderWidth={border ? 1 : 0}
  />
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
  onPressTakePhoto,
  onPressRemovePhoto,
  imageData,
  errorMessage,
  loading,
}: UploadPhotoComponentProps) => (
  <StyledView marginTop={5}>
    {loading && <LoadingPlaceholder />}
    {imageData && <UploadedImage imageData={imageData} />}
    {!imageData && errorMessage && <Text>{`Error loading image: ${errorMessage}`}</Text>}
    <StyledText fontWeight="500" color={theme.colors.TEXT_SUPER_DARK} marginTop={10}>
      {imageData ? 'Change photo' : 'Upload photo'}
    </StyledText>
    <StyledView justifyContent="space-between" marginLeft={-10}>
      <ImageActionButton onPress={onPressChoosePhoto} label="Choose photo from library" />
      <ImageActionButton onPress={onPressTakePhoto} label="Take photo with camera" />
      {imageData && (
        <ImageActionButton
          onPress={onPressRemovePhoto}
          label="Remove photo"
          border={false}
          marginTop={-3}
        />
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

  const removeAttachment = useCallback(
    async (value, imagePath) => {
      if (value) {
        await models.Attachment.delete(value);
      }
      if (imagePath) {
        await deleteFileInDocuments(imagePath);
        setImagePath(null);
      }
    },
    [models.Attachment],
  );

  const removePhotoCallback = useCallback(async () => {
    onChange(null);
    setImageData(null);
    await removeAttachment(value, imagePath);
  }, [onChange, removeAttachment, value, imagePath]);

  const addPhotoCallback = useCallback(
    async imageType => {
      let image: { base64: string; uri: string };
      try {
        if (imageType === IMAGE_SOURCE_TYPES.CAMERA) image = await getImageFromCamera();
        if (imageType === IMAGE_SOURCE_TYPES.LIBRARY) image = await getImageFromPhotoLibrary();
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

      const { path, size } = await resizeImage(imageToBase64URI(image.base64), {
        outputPath: RNFS.DocumentDirectoryPath,
        rotation: 0,
        ...IMAGE_RESIZE_OPTIONS,
      });

      // Make sure the central server has enough space to store a new attachment
      const { canUploadAttachment } = await centralServer.get('health/canUploadAttachment', {});

      if (!canUploadAttachment) {
        Popup.show({
          type: 'Warning',
          title: 'Not enough storage space to upload file',
          textBody:
            'The server has limited storage space remaining. To protect performance, you are currently unable to upload images. Please speak to your system administrator to increase your central server hard drive space.',
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
      setImageData(image.base64);
      setLoading(false);
    },
    [
      centralServer,
      models.Attachment,
      onChange,
      removeAttachment,
      removePhotoCallback,
      value,
      imagePath,
    ],
  );

  return (
    <UploadPhotoComponent
      imageData={imageData}
      errorMessage={errorMessage}
      onPressTakePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.CAMERA)}
      onPressChoosePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.LIBRARY)}
      onPressRemovePhoto={removePhotoCallback}
      loading={loading}
    />
  );
});
