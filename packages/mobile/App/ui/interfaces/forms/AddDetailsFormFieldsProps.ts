import { IProgram } from '~/types';
import { VerticalPosition } from '../VerticalPosition';

export interface AddDetailsFormFieldsProps {
  program: IProgram;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}
