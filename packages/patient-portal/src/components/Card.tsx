import React from 'react';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

type CardVariant = undefined | 'outlined';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
}

const StyledCard = styled(Paper)<{ variant?: CardVariant }>(({ theme, variant }) => ({
  padding: theme.spacing(2),
  backgroundColor: variant === 'outlined' ? 'transparent' : theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : 'none',
}));

export const Card = ({ variant, children }: CardProps) => {
  return (
    <StyledCard elevation={0} variant={variant}>
      {children}
    </StyledCard>
  );
};
