import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';

const CardContainer = styled.div`
  display: flex;

  > div {
    background: ${props => (props.disabled ? '#cccccc' : '#fff')};
    min-width: 140px;
  }
`;

const Content = styled.div`
  padding: 0 16px 24px 16px;
`;

const Title = styled.div`
  color: #326699;
  font-size: 22px;
  margin-bottom: 10px;
`;

const Description = styled.div`
  font-size: 14px;
  color: ${props => (props.disabled ? '#fff' : '#b8b8b8')};
`;

export const CallToActionCard = ({ avatar, title, description, action, disabled }) => {
  return (
    <CardContainer disabled={disabled} onClick={disabled ? () => {} : action}>
      <Card>
        <CardHeader avatar={<Avatar src={avatar} />} />
        <Content>
          <Title>{title}</Title>
          <Description disabled={disabled}>{description}</Description>
        </Content>
      </Card>
    </CardContainer>
  );
};

CallToActionCard.propTypes = {
  avatar: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.func,
};
