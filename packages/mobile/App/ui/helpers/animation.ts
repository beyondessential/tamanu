import { timing, Easing } from 'react-native-reanimated';
import { AnimatedValue } from 'react-navigation';


/**
 * Uses an Animated State to change during the specified period of time.
 */
export const animateState = (
  animatedValue: AnimatedValue,
  toValue: number,
  duration: number,
): void => {
  timing(animatedValue, {
    duration,
    toValue,
    easing: Easing.in(Easing.linear),
  }).start();
};
