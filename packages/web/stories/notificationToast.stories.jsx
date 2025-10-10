import React from 'react';

import 'react-toastify/dist/ReactToastify.css';
import { Button, CustomToastContainer } from '@tamanu/ui-components';
import { notifyError, notifyInfo, notifySuccess } from '../app/utils';
import { Slide } from 'react-toastify';
import { ClearIcon } from '../app/components/Icons/ClearIcon';
import styled from 'styled-components';

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 700px;
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

const singleLineMinWidth = 'Dolor sit amet';
const singleLineMaxWidth =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt';
const multiLineMaxWidth = [
  <b key={Math.random()}>Dolor sit amet, consectetur adipiscing</b>,
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
];
const multiLineMinWidth = [<b key={Math.random()}>Dolor sit amet</b>, 'Lorem ipsum dolor sit amet'];

export const NotifySuccess = () => (
  <ButtonContainer>
    <b>Single line</b>
    <>Max width</>
    <Button onClick={() => notifySuccess(singleLineMaxWidth)}>Show Success</Button>
    <Button onClick={() => notifyInfo(singleLineMaxWidth)}>Show Info</Button>
    <Button onClick={() => notifyError(singleLineMaxWidth)}>Show Error</Button>
    <>Min width</>
    <Button onClick={() => notifySuccess(singleLineMinWidth)}>Show Success</Button>
    <Button onClick={() => notifyInfo(singleLineMinWidth)}>Show Info</Button>
    <Button onClick={() => notifyError(singleLineMinWidth)}>Show Error</Button>
    <b>Multiple lines</b>
    <>Max width</>
    <Button onClick={() => notifySuccess(multiLineMaxWidth)}>Show Multiline Success</Button>
    <Button onClick={() => notifyInfo(multiLineMaxWidth)}>Show Multiline Info</Button>
    <Button onClick={() => notifyError(multiLineMaxWidth)}>Show Multiline Error</Button>
    <>Min width</>
    <Button onClick={() => notifySuccess(multiLineMinWidth)}>Show Multiline Success</Button>
    <Button onClick={() => notifyInfo(multiLineMinWidth)}>Show Multiline Info</Button>
    <Button onClick={() => notifyError(multiLineMinWidth)}>Show Multiline Error</Button>
  </ButtonContainer>
);
