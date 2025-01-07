import React from 'react';

import { NoPermissionScreen } from '../app/views/NoPermissionScreen';
import styled from 'styled-components';

const ViewContainer = styled.div`
  width: 1140px;
  height: 820px;
`;

export default {
  title: 'Permissions/No Permission Screen',
  component: NoPermissionScreen,
};

export const Screen = () => {
  return (
    <ViewContainer>
      <NoPermissionScreen />
    </ViewContainer>
  );
};
