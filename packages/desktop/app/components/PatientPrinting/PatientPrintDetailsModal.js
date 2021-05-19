import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { PatientIDCardPage } from './PatientIDCardPage';
import { PatientStickerLabelPage } from './PatientStickerLabelPage';
import { Button } from '../Button';
import { DriveEtaSharp } from '@material-ui/icons';
import { Colors } from '../../constants';

const StickerIcon = ({ hovered }) => {
  const color = hovered ? '#326699' : '#B8B8B8';
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0)">
        <path d="M5.52352 51.5273L54.4765 51.5273C57.5629 51.5273 60 49.0207 60 46.0038L60 13.996C60 10.9098 57.4934 8.47264 54.4765 8.47264L5.52352 8.47263C2.43715 8.47263 3.54482e-06 10.9793 3.28108e-06 13.9962L4.82881e-07 46.0038C2.13052e-07 49.0903 2.50664 51.5273 5.52352 51.5273ZM3.51563 13.9962C3.51563 12.888 4.41305 11.9883 5.52352 11.9883L54.4765 11.9883C55.5846 11.9883 56.4844 12.8857 56.4844 13.9962L56.4844 46.0038C56.4844 47.112 55.587 48.0117 54.4765 48.0117L5.52352 48.0117C4.41539 48.0117 3.51563 47.1143 3.51563 46.0038L3.51563 13.9962Z" fill={color} />
        <g clip-path="url(#clip1)">
          <path d="M13.8333 20H9.16667C8.52267 20 8 20.5227 8 21.1667V25.8333C8 26.4773 8.52267 27 9.16667 27C9.81067 27 10.3333 26.4773 10.3333 25.8333V22.3333H13.8333C14.4773 22.3333 15 21.8107 15 21.1667C15 20.5227 14.4773 20 13.8333 20Z" fill={color} />
          <path d="M32.8334 33C32.1894 33 31.6667 33.5227 31.6667 34.1667V37.6667H28.1667C27.5227 37.6667 27 38.1893 27 38.8333C27 39.4773 27.5227 40 28.1667 40H32.8334C33.4774 40 34 39.4773 34 38.8333V34.1667C34 33.5227 33.4774 33 32.8334 33Z" fill={color} />
          <path d="M32.8334 20H28.1667C27.5227 20 27 20.5227 27 21.1667C27 21.8107 27.5227 22.3333 28.1667 22.3333H31.6667V25.8333C31.6667 26.4773 32.1894 27 32.8334 27C33.4774 27 34 26.4773 34 25.8333V21.1667C34 20.5227 33.4774 20 32.8334 20Z" fill={color} />
          <path d="M14.6667 37.3333H10.6667V33.3333C10.6667 32.5973 10.0693 32 9.33333 32C8.59733 32 8 32.5973 8 33.3333V38.6667C8 39.4027 8.59733 40 9.33333 40H14.6667C15.4027 40 16 39.4027 16 38.6667C16 37.9307 15.4027 37.3333 14.6667 37.3333Z" fill={color} />
          <path d="M13 24C12.448 24 12 24.308 12 24.6875V34.3125C12 34.692 12.448 35 13 35C13.552 35 14 34.692 14 34.3125V24.6875C14 24.308 13.552 24 13 24Z" fill={color} />
          <path d="M21 24C20.448 24 20 24.308 20 24.6875V34.3125C20 34.692 20.448 35 21 35C21.552 35 22 34.692 22 34.3125V24.6875C22 24.308 21.552 24 21 24Z" fill={color} />
          <path d="M29 24C28.448 24 28 24.308 28 24.6875V34.3125C28 34.692 28.448 35 29 35C29.552 35 30 34.692 30 34.3125V24.6875C30 24.308 29.552 24 29 24Z" fill={color} />
          <path d="M17 24C16.448 24 16 24.2987 16 24.6667V31.3333C16 31.7013 16.448 32 17 32C17.552 32 18 31.7013 18 31.3333V24.6667C18 24.2987 17.552 24 17 24Z" fill={color} />
          <path d="M25 24C24.448 24 24 24.2987 24 24.6667V31.3333C24 31.7013 24.448 32 25 32C25.552 32 26 31.7013 26 31.3333V24.6667C26 24.2987 25.552 24 25 24Z" fill={color} />
          <path d="M17.005 33H16.9851C16.4358 33 16 33.448 16 34C16 34.552 16.4557 35 17.005 35C17.5542 35 18 34.552 18 34C18 33.448 17.5542 33 17.005 33Z" fill={color} />
          <path d="M25.005 33H24.9851C24.4358 33 24 33.448 24 34C24 34.552 24.4557 35 25.005 35C25.5542 35 26 34.552 26 34C26 33.448 25.5542 33 25.005 33Z" fill={color} />
        </g>
        <path d="M46.9375 20.418H38.7578C37.787 20.418 37 21.205 37 22.1758C37 23.1466 37.787 23.9336 38.7578 23.9336H46.9375C47.9083 23.9336 48.6954 23.1466 48.6954 22.1758C48.6954 21.205 47.9083 20.418 46.9375 20.418Z" fill={color} />
        <path d="M51.9375 27.9493H38.7578C37.787 27.9493 37 28.7363 37 29.7071C37 30.6779 37.787 31.4649 38.7578 31.4649H51.9375C52.9083 31.4649 53.6954 30.6779 53.6954 29.7071C53.6954 28.7363 52.9083 27.9493 51.9375 27.9493Z" fill={color} />
        <path d="M43.172 35.4806H38.7579C37.7872 35.4806 37.0001 36.2676 37.0001 37.2384C37.0001 38.2092 37.7872 38.9962 38.7579 38.9962H43.172C44.1427 38.9962 44.9298 38.2092 44.9298 37.2384C44.9298 36.2676 44.1427 35.4806 43.172 35.4806Z" fill={color} />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="60" height="60" fill="white" transform="translate(60 60) rotate(-180)" />
        </clipPath>
        <clipPath id="clip1">
          <rect width="26" height="26" fill="white" transform="translate(8 17)" />
        </clipPath>
      </defs>
    </svg>
  )
};

const IDCardIcon = ({ hovered }) => {
  const color = hovered ? '#326699' : '#B8B8B8';
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0)">
        <path d="M54.4765 8.47266H5.52352C2.43715 8.47266 0 10.9793 0 13.9962V46.004C0 49.0902 2.50664 51.5274 5.52352 51.5274H54.4765C57.5629 51.5274 60 49.0207 60 46.0038V13.9962C60 10.9097 57.4934 8.47266 54.4765 8.47266ZM56.4844 46.0038C56.4844 47.112 55.587 48.0117 54.4765 48.0117H5.52352C4.41539 48.0117 3.51562 47.1143 3.51562 46.0038V13.9962C3.51562 12.888 4.41305 11.9883 5.52352 11.9883H54.4765C55.5846 11.9883 56.4844 12.8857 56.4844 13.9962V46.0038Z" fill={color} />
        <path d="M23.5242 34.3011C24.5456 33.1575 25.168 31.6503 25.168 30C25.168 26.4353 22.2678 23.5351 18.7031 23.5351C15.1384 23.5351 12.2384 26.4353 12.2384 30C12.2384 31.6503 12.8607 33.1575 13.882 34.301C11.2051 35.9329 9.41402 38.8803 9.41402 42.2382C9.41402 43.209 10.201 43.996 11.1718 43.996H26.2343C27.2051 43.996 27.9921 43.209 27.9921 42.2382C27.9921 38.8803 26.201 35.9331 23.5242 34.3011ZM18.7031 27.0507C20.3293 27.0507 21.6524 28.3738 21.6524 30C21.6524 31.6262 20.3293 32.9492 18.7031 32.9492C17.0769 32.9492 15.754 31.6262 15.754 30C15.754 28.3738 17.0769 27.0507 18.7031 27.0507ZM13.2032 40.4805C13.9485 38.1539 16.1323 36.4649 18.7031 36.4649C21.274 36.4649 23.4576 38.1538 24.2031 40.4805H13.2032Z" fill={color} />
        <path d="M48.8282 25.418H35.6485C34.6777 25.418 33.8907 26.205 33.8907 27.1758C33.8907 28.1466 34.6777 28.9336 35.6485 28.9336H48.8282C49.799 28.9336 50.586 28.1466 50.586 27.1758C50.586 26.205 49.799 25.418 48.8282 25.418Z" fill={color} />
        <path d="M48.8282 16.0038H11.1718C10.201 16.0038 9.41402 16.7909 9.41402 17.7617C9.41402 18.7324 10.201 19.5195 11.1718 19.5195H48.8282C49.7989 19.5195 50.586 18.7324 50.586 17.7617C50.586 16.7909 49.7989 16.0038 48.8282 16.0038Z" fill={color} />
        <path d="M48.8282 32.9493H35.6485C34.6777 32.9493 33.8907 33.7363 33.8907 34.7071C33.8907 35.6779 34.6777 36.4649 35.6485 36.4649H48.8282C49.799 36.4649 50.586 35.6779 50.586 34.7071C50.586 33.7363 49.799 32.9493 48.8282 32.9493Z" fill={color} />
        <path d="M45.0625 40.4806H35.6485C34.6777 40.4806 33.8907 41.2676 33.8907 42.2384C33.8907 43.2092 34.6777 43.9962 35.6485 43.9962H45.0625C46.0333 43.9962 46.8203 43.2092 46.8203 42.2384C46.8203 41.2676 46.0333 40.4806 45.0625 40.4806Z" fill={color} />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="60" height="60" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
};

const PRINT_OPTIONS = [
  {
    label: "Print labels",
    component: PatientStickerLabelPage,
    icon: StickerIcon,
  },
  {
    label: "Print ID",
    component: PatientIDCardPage,
    icon: IDCardIcon,
  }
]



export const PatientPrintDetailsModal =
  ({
    open,
    onClose,
    patient,
    readonly,
  }) => {
    const [currentlyPrinting, setCurrentlyPrinting] = React.useState(null);

    const CurrentlyPrintingComponent = PRINT_OPTIONS.find(({ label }) => label === currentlyPrinting)?.component

    console.log(patient, readonly);
    return ( // TODO: Make PrintPortals only render on button click, so they don't interfere with eachother
      <Modal title="Select label" open={open} onClose={() => { onClose(); setCurrentlyPrinting(null); }}>
        {
          CurrentlyPrintingComponent
            ? <CurrentlyPrintingComponent patient={patient} />
            : <PrintOptionList setCurrentlyPrinting={setCurrentlyPrinting} />
        }
      </Modal>
    );
  };

const PrintOptionList = ({ setCurrentlyPrinting }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {PRINT_OPTIONS.map(({ label, icon }) => <PrintOption label={label} onPress={() => setCurrentlyPrinting(label)} icon={icon} />)}
    </div>
  )
}

const PrintOptionButton = styled(Button)`
  background: ${Colors.white};
  display: grid;
  justify-content: center;
  text-align: -webkit-center;
  height: 140px;
  width: 180px;
  margin: 1rem;
`;

const PrintOption = ({ label, icon, onPress }) => {
  const [hovered, setHovered] = React.useState(false);
  const Icon = icon;

  return (
    <PrintOptionButton onClick={onPress} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {Icon ? <Icon hovered={hovered} /> : 'no icon 😢'}
      {label}
    </PrintOptionButton>
  );
}