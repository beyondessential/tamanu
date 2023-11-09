import React from 'react';
import { Colors } from '../../../constants';

export const CustomDot = props => {
  // cx, cy is the position of the current dot
  const { cx, cy, payload, size = 7, active } = props;
  if (!payload) {
    return null;
  }
  const x = cx ? cx - (size / 2 + 0.5) : 0;
  const y = cy ? cy - (size / 2 + 0.5) : 0;

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
    <svg x={x} y={y} width={size + 1} height={size + 1} viewBox={`0 0 ${size + 1} ${size + 1}`}>
      <circle
        cx={size / 2 + 0.5}
        cy={size / 2 + 0.5}
        r={size / 2 - 0.5}
        fill={active ? color : Colors.white}
        stroke={color}
      />
    </svg>
  );
};
