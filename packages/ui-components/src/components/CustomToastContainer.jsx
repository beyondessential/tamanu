import React from 'react';
import styled from 'styled-components';
import { ToastContainer, Slide } from 'react-toastify';
import { TAMANU_COLORS } from '../constants';
import { ClearIcon } from './Icons';

import 'react-toastify/dist/ReactToastify.css';

const StyledToastContainer = styled(ToastContainer)`
  &&&.Toastify__toast-container {
    min-inline-size: 20rem;
    max-inline-size: 25rem;
    inline-size: auto;
  }

  .Toastify__toast--success {
    background-color: #e9f5ee;
    color: ${TAMANU_COLORS.green};
  }

  .Toastify__toast--error {
    background-color: #fff0ee;
    color: ${TAMANU_COLORS.alert};
  }

  .Toastify__toast--info {
    background-color: #ebf0f5;
    color: ${TAMANU_COLORS.primary};
  }

  .Toastify__toast {
    min-block-size: 2.5rem;
    border-radius: 0.2rem;
    padding-block: 0.7rem;
    padding-inline: 1rem;
    min-inline-size: 20rem;
    max-inline-size: 25rem;
    inline-size: fit-content;
    margin-inline-start: auto;

    .Toastify__toast-body {
      padding: 0;
      margin-inline-end: 3.375rem;
    }
    svg {
      inline-size: 0.625rem;
      block-size: 0.625rem;
      position: absolute;
      inset-inline-end: 1rem;
      inset-block-start: 1rem;
    }
  }
`;

export const CustomToastContainer = () => {
  return (
    <StyledToastContainer
      hideProgressBar
      transition={Slide}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      icon={false}
      limit={5}
      closeButton={<ClearIcon />}
    />
  );
};
