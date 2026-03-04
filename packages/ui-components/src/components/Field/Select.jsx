import React from 'react';
import ReactSelect, { components } from 'react-select';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../../constants';

export const Select = styled(ReactSelect)`
  .react-select__clear-indicator {
    display: none;
  }
  .react-select__indicator-separator {
    display: none;
  }

  /* Scrollbar styling (for windows) */
  /* scrollbar total width */
  .react-select__menu::-webkit-scrollbar {
    background-color: rgba(0, 0, 0, 0);
    width: 16px;
    height: 16px;
    z-index: 999999;
  }
  /* background of the scrollbar except button or resizer */
  .react-select__menu::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0);
  }
  /* scrollbar itself */
  .react-select__menu::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0);
    border-radius: 16px;
    border: 0px solid #fff;
  }
  /* set button(top and bottom of the scrollbar) */
  .react-select__menu::-webkit-scrollbar-button {
    display: none;
  }
  /* scrollbar when element is hovered */
  .react-select__menu:hover::-webkit-scrollbar-thumb {
    background-color: #a0a0a5;
    border: 4px solid #fff;
  }
  /* scrollbar when scrollbar is hovered */
  .react-select__menu::-webkit-scrollbar-thumb:hover {
    background-color: #a0a0a5;
    border: 4px solid #f4f4f4;
  }
`;

const StyledIndicator = styled.svg`
  ${props => (props.$focused ? '' : 'transform: rotate(180deg);')}
`;

export const SelectDropdownIndicator = props => (
  <components.DropdownIndicator {...props} data-testid="dropdownindicator-68zp">
    <StyledIndicator
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      $focused={props?.isFocused}
      data-testid="styledindicator-dx40"
    >
      <path
        d="M5.00008 0.144765C5.15633 0.144765 5.30602 0.207578 5.41633 0.320077L9.8282 4.79445C10.0573 5.02758 10.0573 5.40477 9.8282 5.63758C9.59852 5.87039 9.22477 5.87039 8.99633 5.63758L5.00008 1.58445L1.00477 5.63789C0.774766 5.8707 0.401641 5.8707 0.172266 5.63789C-0.0571088 5.40539 -0.0571088 5.02758 0.172266 4.79445L4.58383 0.319452C4.69477 0.207577 4.84445 0.144765 5.00008 0.144765Z"
        fill={TAMANU_COLORS.darkText}
      />
    </StyledIndicator>
  </components.DropdownIndicator>
);

export const SelectMultiValueRemove = props => {
  return (
    <components.MultiValueRemove {...props} data-testid="multivalueremove-vmnc">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.85 0.15C7.65 -0.0499999 7.35 -0.0499999 7.15 0.15L4 3.3L0.85 0.15C0.65 -0.0499999 0.35 -0.0499999 0.15 0.15C-0.0499999 0.35 -0.0499999 0.65 0.15 0.85L3.3 4L0.15 7.15C-0.0499999 7.35 -0.0499999 7.65 0.15 7.85C0.25 7.95 0.35 8 0.5 8C0.65 8 0.75 7.95 0.85 7.85L4 4.7L7.15 7.85C7.25 7.95 7.4 8 7.5 8C7.6 8 7.75 7.95 7.85 7.85C8.05 7.65 8.05 7.35 7.85 7.15L4.7 4L7.85 0.85C8.05 0.65 8.05 0.35 7.85 0.15Z"
          fill={TAMANU_COLORS.darkText}
        />
      </svg>
    </components.MultiValueRemove>
  );
};
