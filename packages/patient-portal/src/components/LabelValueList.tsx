import React from 'react';
import { Box, Typography } from '@mui/material';

import { StyledList } from './StyledList';
import { styled } from '@mui/material/styles';

const ListGrid = styled(StyledList)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  gridColumnGap: theme.spacing(2.5),
  gridRowGap: theme.spacing(0.75),
}));

const AlignedContentsWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

export const LabelValueList = ({ children }: { children: React.ReactNode }) => {
  return <ListGrid>{children}</ListGrid>;
};

LabelValueList.ListItem = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) => {
  return (
    <>
      <AlignedContentsWrapper>
        <Typography>{label}</Typography>
      </AlignedContentsWrapper>
      <AlignedContentsWrapper>
        <Typography fontWeight="bold">{value}</Typography>
      </AlignedContentsWrapper>
    </>
  );
};
