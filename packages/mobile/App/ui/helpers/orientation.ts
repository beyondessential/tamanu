import Orientation from 'react-native-orientation';

// Lock or unlock the screen to different orientations (portrait, landscape)
export const updateScreenOrientation = (route: string): void => {
  if (route.includes('VaccineTabs')) {
    Orientation.unlockAllOrientations();
  } else {
    Orientation.lockToPortrait();
  }
};
