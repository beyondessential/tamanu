import React, { FunctionComponentElement, ReactNode } from 'react';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';

// export interface TicTacToeCellProps {
//   /**
//    * Value to display, either empty (" ") or "X" / "O".
//    *
//    * @default " "
//    **/
//   value?: ' ' | 'X' | 'O';

//   /** Cell position on game board. */
//   position: { x: number; y: number };

//   /** Called when an empty cell is clicked. */
//   onClick?: (x: number, y: number) => void;
// }

export interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
}

export default function Button({
  children,
  onPress,
}: ButtonProps): FunctionComponentElement<{}> {
  return (
    <TouchableOpacity onPress={() => onPress()}>{children}</TouchableOpacity>
  );
}
