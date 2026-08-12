import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';
import { Popup } from 'popup-ui';
import { useNetInfo } from '@react-native-community/netinfo';
import { ERROR_TYPE } from '@tamanu/errors';
import { useBackend } from '~/ui/hooks';
import { StyledImage, StyledView, StyledText } from '/styled/common';
import {
  getImageFromPhotoLibrary,
  getImageFromCamera,
  imageToBase64URI,
  resizeImage,
} from '/helpers/image';
import { deleteFileInDocuments } from '/helpers/file';
import { BlobAwaitingUploadError } from '~/services/blobs';
import type { BackendManager } from '~/services/BackendManager';
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

const AWAITING_UPLOAD_MESSAGE =
  'This image has not finished uploading from the device that captured it.\nTry again later.';

const NOT_ON_DEVICE_MESSAGE =
  'This image is not on this device yet.\nConnect to the internet to fetch it.';

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
  hasPhoto: boolean;
  imageData: string;
  errorMessage?: string;
  loading: boolean;
}

const IMAGE_WIDTH = Dimensions.get('window').width * 0.6;

const resolvePhoto = async (
  attachmentId: string,
  { models, blobCache }: Pick<BackendManager, 'models' | 'blobCache'>,
  isInternetReachable: boolean,
): Promise<{ imageData?: string; errorMessage?: string }> => {
  try {
    const attachment = await models.Attachment.findOne({ where: { id: attachmentId } });
    if (!attachment?.hash) {
      return { errorMessage: NOT_ON_DEVICE_MESSAGE };
    }
    return { imageData: await blobCache.readBase64(attachment.hash) };
  } catch (error) {
    // spec: MOB, XFER — an existing file awaiting its content, with the
    // awaiting-upload and awaiting-fetch cases distinguished
    if (error instanceof BlobAwaitingUploadError) {
      return { errorMessage: AWAITING_UPLOAD_MESSAGE };
    }
    if (!isInternetReachable) {
      return { errorMessage: NOT_ON_DEVICE_MESSAGE };
    }
    return { errorMessage: `Error loading image: ${error.message}` };
  }
};

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
  hasPhoto,
  imageData,
  errorMessage,
  loading,
}: UploadPhotoComponentProps) => (
  <StyledView marginTop={5}>
    {loading && <LoadingPlaceholder />}
    {imageData && <UploadedImage imageData={imageData} />}
    {!imageData && errorMessage && <Text>{errorMessage}</Text>}
    <StyledText fontWeight="500" color={theme.colors.TEXT_SUPER_DARK} marginTop={10}>
      {hasPhoto ? 'Change photo' : 'Upload photo'}
    </StyledText>
    <StyledView justifyContent="space-between" marginLeft={-10}>
      <ImageActionButton onPress={onPressChoosePhoto} label="Choose photo from library" />
      <ImageActionButton onPress={onPressTakePhoto} label="Take photo with camera" />
      {hasPhoto && (
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
  const [loading, setLoading] = useState(Boolean(value));
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [hasPhoto, setHasPhoto] = useState(Boolean(value));
  // The value already taken up, so a photo captured here is not read back from
  // the store, and a read still in flight when it is removed is discarded.
  const shownValue = useRef(null);
  const { models, blobCache } = useBackend();
  const { isInternetReachable } = useNetInfo();

  const removeAttachment = useCallback(async value => {
    if (!value) {
      return;
    }
    const attachment = await models.Attachment.findOne({ where: { id: value } });
    if (!attachment) {
      return;
    }
    await models.Attachment.delete(value);
    // A removed draft photo's blob has no referencing record left, so it can
    // never become eligible for push; demote it to reclaimable cache.
    if (attachment.hash) {
      const stillReferenced = await models.Attachment.findOne({
        where: { hash: attachment.hash },
      });
      if (!stillReferenced) {
        await blobCache.demote(attachment.hash);
      }
    }
  }, []);

  const removePhotoCallback = useCallback(async () => {
    onChange(null);
    shownValue.current = null;
    setHasPhoto(false);
    setImageData(null);
    setErrorMessage(null);
    await removeAttachment(value);
  }, [value]);

  // spec: MOB
  // A photo the answer already holds resolves through its record's hash:
  // content the device holds reads without connectivity, content it does not
  // hold is fetched by hash.
  useEffect(() => {
    if (!value || value === shownValue.current) {
      return;
    }
    shownValue.current = value;
    let cancelled = false;

    setHasPhoto(true);
    setImageData(null);
    setErrorMessage(null);
    setLoading(true);

    (async (): Promise<void> => {
      const resolved = await resolvePhoto(value, { models, blobCache }, isInternetReachable);
      if (cancelled || shownValue.current !== value) {
        return;
      }
      setImageData(resolved.imageData ?? null);
      setErrorMessage(resolved.errorMessage ?? null);
      setLoading(false);
    })();

    return (): void => {
      cancelled = true;
    };
  }, [value, models, blobCache, isInternetReachable]);

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
        setErrorMessage(`Error loading image: ${error.message}`);
        return;
      }

      setHasPhoto(false);
      setImageData(null);
      setLoading(true);

      // image-picker produces quite expensive files so
      // always delete them straight away to save storage
      await deleteFileInDocuments(image.uri.replace('file://', ''));

      // Remove previous photo when selecting a new photo
      await removeAttachment(value);

      const { path } = await resizeImage(imageToBase64URI(image.base64), {
        outputPath: RNFS.DocumentDirectoryPath,
        rotation: 0,
        ...IMAGE_RESIZE_OPTIONS,
      });

      // spec: MOB
      // The photo is admitted to the device's blob store at the outbox tier and
      // the record carries only its hash. Capture completes without
      // connectivity: the central server's own capacity governs the blob when
      // it is pushed, not at capture.
      let putResult;
      try {
        putResult = await blobCache.putOutbox(path);
      } catch (error) {
        setLoading(false);
        await deleteFileInDocuments(path);
        if (error?.type === ERROR_TYPE.STORAGE_INSUFFICIENT) {
          // spec: CAP — the refusal names the device's storage as the cause
          Popup.show({
            type: 'Warning',
            title: 'Not enough storage space on this device',
            textBody:
              'This device is running out of storage space, so the photo cannot be saved. Free up space on the device and try again.',
            callback: (): void => Popup.hide(),
          });
          return;
        }
        setErrorMessage(`Error loading image: ${error.message}`);
        return;
      }

      const { id } = await models.Attachment.createAndSaveOne({
        hash: putResult.hash,
        size: putResult.size,
        type: 'image/jpeg',
      });

      onChange(id);
      shownValue.current = id;
      setHasPhoto(true);
      setImageData(image.base64);
      setLoading(false);
    },
    [value],
  );

  return (
    <UploadPhotoComponent
      hasPhoto={hasPhoto}
      imageData={imageData}
      errorMessage={errorMessage}
      onPressTakePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.CAMERA)}
      onPressChoosePhoto={() => addPhotoCallback(IMAGE_SOURCE_TYPES.LIBRARY)}
      onPressRemovePhoto={removePhotoCallback}
      loading={loading}
    />
  );
});
