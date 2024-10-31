/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components';
import { useAuth } from '../../../contexts/Auth';

const Container = styled.div`
  margin: 20px 24px 24px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 20px 12px;
  height: 460px;
`;

const Content = styled.div`
  border-radius: 4px;
  background-color: ${Colors.background};
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 158px 151px;
  font-size: 14px;
  font-weight: 500;
  white-space: pre;
  text-align: center;
  color: ${Colors.primary};
`;

export const withEncounterPanePermissions = (Component, props, permissionNoun) => {
  const { ability } = useAuth();
  const hasPermission = ability.can('list', permissionNoun);

  return hasPermission ? (
    <Component {...props} />
  ) : (
    <Container>
      <Content>
        <TranslatedText
          stringId="encounter.pane.noPermissions"
          fallback="You do not have permission to use this feature\nPlease speak to your System Administrator if you think this is incorrect."
        />
      </Content>
    </Container>
  );
};
