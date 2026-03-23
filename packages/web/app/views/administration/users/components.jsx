import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { Button, DataFetchingTable, Field, TextField } from '../../../components';
import { Colors } from '../../../constants';
import { ContentContainer } from '../components/AdminViewContainer';

export const Header = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: grid;
  gap: 0.625rem;
  grid-template-columns: auto minmax(min-content, max-content);
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
`;

export const AddButton = styled(Button)`
  align-self: flex-end;
`;

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;
`;

export const Article = styled.article`
  border-block-start: 1px solid ${Colors.outline};
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

export const RequiredTextField = props => (
  <Field autoComplete="off" component={TextField} required {...props} />
);

export const plusIcon = (
  <PlusIcon
    aria-hidden
    width={18}
    height={18}
    style={{ color: 'oklch(from currentColor l c h / 96%)', marginInlineEnd: '0.5em' }}
  />
);

export const shortInlineSkeleton = (
  <Skeleton
    animation="wave"
    sx={{ display: 'inline-block', verticalAlign: 'text-bottom' }}
    width="12ch"
  />
);
