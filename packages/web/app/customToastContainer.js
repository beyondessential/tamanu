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
    position: relative;
  }
  .Toastify__toast {
    min-height: 40px;
    height: 40px;
    border-radius: 3px;
    padding: 11px 20px;
    line-height: 1px;
    .Toastify__toast-body {
      padding: 0;
    }
    svg {
      height: 100%;
      display: flex;
      align-items: center;
    }
  }
`;
