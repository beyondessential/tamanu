import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

const COLORS = {
  green: {
    background: '#E9F5EE',
    text: '#19934E',
  },
  orange: {
    background: '#FAF0E6',
    text: '#CB6100',
  },
  blue: {
    background: '#E8F1FB',
    text: '#1172D1',
  },
  red: {
    background: '#FFF0EE',
    text: '#F76853',
  },
  purple: {
    background: '#ECE6FA',
    text: '#4101C9',
  },
};

type ChipColor = keyof typeof COLORS;
type ChipProps = Omit<React.ComponentProps<typeof MuiChip>, 'color' | 'sx'> & {
  color?: ChipColor;
  sx?: SxProps<Theme>;
};

export const Chip: React.FC<ChipProps> = ({ color, sx, ...props }) => {
  const palette = color ? COLORS[color] : undefined;

  const baseSx: SxProps<Theme> = palette
    ? {
        backgroundColor: palette.background,
        color: palette.text,
        lineHeight: 2,
        padding: '15px 10px',
        '& .MuiChip-label': { color: palette.text },
        '& .MuiChip-icon, & .MuiChip-deleteIcon': { color: palette.text },
      }
    : {};

  const computedSx: SxProps<Theme> = sx ? ([baseSx, sx] as SxProps<Theme>) : baseSx;

  return <MuiChip {...props} sx={computedSx} />;
};
