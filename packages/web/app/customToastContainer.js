import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import { Colors } from './constants';

export const CustomToastContainer = styled(ToastContainer)`
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
    width: 379px;
    border-radius: 3px;
    padding: 11px 12px;
    display: flex;
    align-items: center;

    .Toastify__toast-body {
      padding: 0;
      border: 1px solid green;
      max-width: 80%;
    }
    svg {
      width: 12px;
      height: 12px;
      border: 1px red solid
    }
  }
`;
