import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import { Colors } from './constants';

export const CustomToastContainer = styled(ToastContainer)`
  &&&.Toastify__toast-container {
    min-width: 303px;
    max-width: 379px;
    width: auto;
  }
  .Toastify__toast--success {
    background-color: #e9f5ee;
    color: ${Colors.green};
  }

  .Toastify__toast--error {
    background-color: #fff0ee;
    color: ${Colors.alert};
  }

  .Toastify__toast--info {
    background-color: #ebf0f5;
    color: ${Colors.primary};
  }
  .Toastify__toast {
    min-height: 40px;
    border-radius: 3px;
    padding: 11px 12px;
    min-width: 303px;
    max-width: 379px;
    width: fit-content;
    margin-left: auto;

    .Toastify__toast-body {
      padding: 0;
      margin-right: 54px;

    }
    svg {
      width: 10px;
      height: 10px;
      position: absolute;
      right: 16px;
      top: 16px;
    }
  }
`;
