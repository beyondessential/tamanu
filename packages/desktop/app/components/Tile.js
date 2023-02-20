import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import { Typography } from '@material-ui/core';
import LabelIcon from '@material-ui/icons/Label';
import { MenuButton } from './MenuButton';

const Container = styled.div`
  background: white;
  border-radius: 5px;
  padding: 12px;
  width: 150px;
  overflow: hidden;

  margin: 0 12px 12px;

  &:first-child,
  &:last-child {
    margin-left: 0;
    margin-right: 0;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;

  .MuiIconButton-root {
    margin-top: -8px;
    margin-right: -8px;
  }
`;

const Title = styled(Typography)`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const Text = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

export const Tile = ({ Icon, title, text, actions, ...props }) => (
  <Container {...props}>
    <Row>
      <Icon color="primary" />
      {actions && <MenuButton actions={actions} iconDirection="horizontal" />}
    </Row>
    <Title>{title}</Title>
    {text && <Text>{text}</Text>}
  </Container>
);

Tile.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
  Icon: PropTypes.any,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      onClick: PropTypes.func,
    }),
  ),
};

Tile.defaultProps = {
  Icon: LabelIcon,
  title: null,
  text: null,
  actions: null,
};
