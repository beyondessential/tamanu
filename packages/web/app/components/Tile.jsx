import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import { Typography } from '@material-ui/core';
import LabelIcon from '@material-ui/icons/Label';
import { MenuButton } from './MenuButton';
import { TableCellTag } from './Tag';

const Container = styled.div`
  background: white;
  border-radius: 5px;
  padding: 10px 10px 8px 10px;
  width: 150px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-left: 2px;
  padding-right: 2px;

  .MuiIconButton-root {
    margin-top: -8px;
    margin-right: -8px;
  }
`;

const Text = styled(Typography)`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-bottom: 4px;
`;

const Main = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

export const Tile = React.memo(({ Icon, main, text, isReadOnly, actions, ...props }) => (
  <Container {...props}>
    <Header>
      <Icon color="primary" />
      {actions && !isReadOnly && <MenuButton actions={actions} iconDirection="horizontal" />}
    </Header>
    <Text>{text}</Text>
    <Main>{main}</Main>
  </Container>
));

Tile.propTypes = {
  main: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.element]),
  text: PropTypes.string,
  Icon: PropTypes.oneOfType([PropTypes.node, PropTypes.element, PropTypes.object]),
  actions: PropTypes.objectOf(PropTypes.func),
  isReadOnly: PropTypes.bool,
};

Tile.defaultProps = {
  Icon: LabelIcon,
  main: null,
  text: null,
  actions: null,
  isReadOnly: false,
};

export const TileContainer = styled.div`
  display: flex;
  align-items: stretch;
  overflow: auto;

  > div {
    flex: 1;
    min-width: 140px;
    margin: 0 8px;

    &:last-child {
      margin-right: 0;
    }

    &:first-child {
      margin-left: 0;
    }
  }
`;

const OverflowContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TileTooltip = React.memo(({ text, ...props }) => (
  <Tooltip title={text} placement="top" {...props}>
    <OverflowContainer>{text}</OverflowContainer>
  </Tooltip>
));

export const TileTag = styled(TableCellTag)`
  margin-left: -2px;
  margin-right: -2px;
`;
