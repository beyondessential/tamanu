import Collapse, { collapseClasses } from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';

import { ClearIcon as CloseDrawerIcon } from './Icons';
import { BodyText, Heading4 } from './Typography';

const StyledCollapse = styled(Collapse)`
  &.${collapseClasses.root} {
    z-index: 20;
    background-color: ${TAMANU_COLORS.background};
    block-size: 100%;

    // Cannot simply use ‘collapseClasses.entered’, because during transition neither class applies
    &:not(.${collapseClasses.hidden}) {
      border-inline-start: max(0.0625rem, 1px) ${TAMANU_COLORS.outline} solid;
    }
  }
`;

const Wrapper = styled.div`
  block-size: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  inline-size: 21rem;

  > * {
    padding-inline: 1rem;
  }
`;

const Header = styled.div`
  align-items: baseline;
  border-block-end: max(0.0625rem, 1px) ${TAMANU_COLORS.outline} solid;
  display: grid;
  grid-template-columns: 1fr auto;
  padding-block: 1rem 0.75rem;
  position: sticky;
`;

const Title = styled(Heading4)`
  background-color: ${TAMANU_COLORS.background};
  font-size: 1rem;
  margin-block: 0;
`;

const DrawerBody = styled.section`
  overflow-y: auto;
  padding-block: 1rem 2.5rem;

  // A bit blunt but the base form fields are going to have their size tweaked in a
  // later card so this is a bridging solution just for this drawer
  .label-field,
  .MuiInputBase-input,
  .MuiFormControlLabel-label,
  div {
    font-size: 0.75rem;
  }
`;

const Description = styled(BodyText)`
  color: ${TAMANU_COLORS.midText};
  font-size: 0.75rem;
  margin-block-end: 1rem;
`;

export const Drawer = ({
  open,
  onClose,
  title,
  description,
  children,
  orientation = 'horizontal',
  ...props
}) => {
  return (
    <StyledCollapse
      in={open}
      orientation={orientation}
      {...props}
      data-testid="styledcollapse-6k1x"
    >
      <Wrapper data-testid="wrapper-7g6v">
        <Header data-testid="header-odk1">
          <Title data-testid="title-bpjt">{title}</Title>
          <IconButton aria-label="Close drawer" onClick={onClose} data-testid="iconbutton-354x">
            <CloseDrawerIcon data-testid="closedrawericon-76xf" />
          </IconButton>
        </Header>
        <DrawerBody data-testid="drawerbody-9l6q">
          {description && <Description data-testid="description-eo9s">{description}</Description>}
          {children}
        </DrawerBody>
      </Wrapper>
    </StyledCollapse>
  );
};
