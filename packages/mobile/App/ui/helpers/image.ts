import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

/**
 * @see https://github.com/bamlab/react-native-image-resizer#api
 */
interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  compressFormat?: 'JPEG' | 'PNG' | 'WEBP';
  quality?: number;
  rotation?: number;
  outputPath?: string;
  keepMeta?: boolean;
  mode?: 'contain' | 'cover' | 'stretch';
  onlyScaleDown?: boolean;
}

const getImageDataFromResponse = image => {
  if (image.errorCode) throw new Error(image.errorMessage);
  if (image.didCancel) return null;
  return image.assets[0];
};

export const getImageFromCamera = async () => {
  try {
    const cameraResponse = await launchCamera({ mediaType: 'photo', includeBase64: true });
    return getImageDataFromResponse(cameraResponse);
  } catch (error) {
    throw new Error(error);
  }
};

export const getImageFromPhotoLibrary = async () => {
  try {
    const photoLibraryResponse = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    });
    return getImageDataFromResponse(photoLibraryResponse);
  } catch (error) {
    throw new Error(error);
  }
};

export const imageToBase64URI = (image: string): string => `data:image/jpeg;base64, ${image}`;

export const resizeImage = (path: string, options: ResizeOptions) => {
  const {
    maxWidth,
    maxHeight,
    compressFormat = 'JPEG',
    quality = 100,
    rotation,
    outputPath,
    keepMeta,
    mode,
    onlyScaleDown = true,
  } = options;

  return ImageResizer.createResizedImage(
    path,
    maxWidth,
    maxHeight,
    compressFormat,
    quality,
    rotation,
    outputPath,
    keepMeta,
    { mode, onlyScaleDown },
  );
};
