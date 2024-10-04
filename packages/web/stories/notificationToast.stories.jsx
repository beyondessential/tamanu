import React from 'react';

import 'react-toastify/dist/ReactToastify.css';
import { CustomToastContainer } from '../app/customToastContainer';
import { Button } from '../app/components';
import { notifyError, notifyInfo, notifySuccess } from '../app/utils';
import { Slide } from 'react-toastify';
import { ClearIcon } from '../app/components/Icons/ClearIcon';
import styled from 'styled-components';

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
  width: 200px;
  justify-content: space-between;
`;

export default {
  title: 'Notification/Toasts',
  decorators: [
    Story => (
      <div>
        <CustomToastContainer
          hideProgressBar
          transition={Slide}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          icon={false}
          limit={5}
          autoClose={false}
          closeButton={<ClearIcon />}
        />
        <Story />
      </div>
    ),
  ],
};

const singleLineMessage = 'Dolor sit amet, consectetur adipiscing';
const multiLineMessage = [
  <b key={Math.random()}>Dolor sit amet, consectetur adipiscing</b>,
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
];

export const NotifySuccess = () => (
  <ButtonContainer>
    <Button onClick={() => notifySuccess(singleLineMessage)}>Show Success</Button>
    <Button onClick={() => notifyInfo(singleLineMessage)}>Show Info</Button>
    <Button onClick={() => notifyError(singleLineMessage)}>Show Error</Button>
    <Button onClick={() => notifySuccess(multiLineMessage)}>Show Multiline Success</Button>
    <Button onClick={() => notifyInfo(multiLineMessage)}>Show Multiline Info</Button>
    <Button onClick={() => notifyError(multiLineMessage)}>Show Multiline Error</Button>
  </ButtonContainer>
);
