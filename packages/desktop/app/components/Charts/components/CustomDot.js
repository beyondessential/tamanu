import React from 'react';
import { Colors } from '../../../constants';

export const CustomDot = props => {
  // cx, cy is the position of the current dot
  const { cx, cy, payload, size = 7, active } = props;
  const color = payload.dotColor;

  return (
    // size = 3 as example:
    //
    //          x   cx
    // y  ┌─────┌───────┼────────>
    //    │     │   ⬤  │
    // cy |     │ ⬤⬤⬤│ size = 3 (⬤⬤⬤)
    //    │     │   ⬤  │
    //    │     └───────┼
    //    v
    <svg
      x={cx - (size / 2 + 0.5)}
      y={cy - (size / 2 + 0.5)}
      width={size + 1}
      height={size + 1}
      viewBox={`0 0 ${size + 1} ${size + 1}`}
    >
      <circle
        cx={size / 2 + 0.5}
        cy={size / 2 + 0.5}
        r={size / 2}
        fill={active ? color : Colors.white}
        stroke={color}
      />
    </svg>
  );
};
