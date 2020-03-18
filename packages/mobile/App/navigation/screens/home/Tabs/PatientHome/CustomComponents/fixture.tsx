// Helpers
import { MaleGender } from '/helpers/constants';

export const mockAvatar = {
  size: 60,
  age: 34,
  name: 'Tony Robbins',
  gender: MaleGender.value,
  city: 'Mbelagha',
};

export interface ButtonProps {
  onPress: () => void;
}
