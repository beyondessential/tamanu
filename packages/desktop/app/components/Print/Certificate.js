import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

import { useApi } from '../../api';
import { getCurrentUser } from '../../store/auth';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { PrintLetterhead } from './Letterhead';
import { DateDisplay } from '../DateDisplay';

const FOOTER_IMG_ASSET_NAME = 'certificate-bottom-half-img';

export const Spacer = styled.div`
  margin-top: 2.5rem;
`;

export const Table = styled.table`
  border: 1px solid ${Colors.darkText};
  border-collapse: collapse;

  thead {
    font-weight: bold;
  }
  th,
  td {
    padding: 5px;
    border: 1px solid ${Colors.darkText};
    font-size: 13px;
  }
`;

const PatientDetailsHeader = styled(Typography)`
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: bold;
`;

const TwoColumnContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
`;

const PRIMARY_DETAILS_FIELDS = {
  firstName: null,
  lastName: null,
  dateOfBirth: ({ dateOfBirth }) => (
    <DateDisplay date={dateOfBirth} showDate={false} showExplicitDate />
  ),
  sex: null,
  displayId: null,
  passport: ({ additionalData }) => additionalData?.passport,
  nationalityId: ({ additionalData }) => additionalData?.nationality?.name,
};

const Base64Image = ({ data, mediaType = 'image/jpeg', ...props }) => (
  <img {...props} src={`data:${mediaType};base64,${data}`} alt="" />
);

const SizedBase64Image = styled(Base64Image)`
  width: 100%;
  height: 100%;
  object-fit: scale-down;
  object-position: 0px 0px;
`;

const CertificateWrapper = styled.div`
  ${props =>
    props.watermark && props.watermarkType
      ? `background: linear-gradient(rgb(243, 245, 247,.9), rgb(243, 245, 247,.9)), url("data:${props.watermarkType};base64,${props.watermark}");
      background-repeat: no-repeat;
      background-attachment: scroll;
      background-position: center;
      background-size: 70%;`
      : ''}
`;

export const Certificate = ({
  patient,
  header,
  footer = null,
  watermark,
  watermarkType,
  primaryDetailsFields,
  customAccessors = {},
  children,
}) => {
  const [footerImg, setFooterImg] = useState('');
  const [footerImgType, setFooterImgType] = useState('');
  const api = useApi();

  useEffect(() => {
    (async () => {
      const response = await api.get(`asset/${FOOTER_IMG_ASSET_NAME}`);
      setFooterImg(Buffer.from(response.data).toString('base64'));
      setFooterImgType(response.type);
    })();
  }, [api]);

  const currentUser = useSelector(getCurrentUser);
  const { getLocalisation } = useLocalisation();
  const detailsFieldsToDisplay =
    primaryDetailsFields ||
    Object.keys(PRIMARY_DETAILS_FIELDS).filter(
      ([name]) => getLocalisation(`fields.${name}.hidden`) !== true,
    );
  return (
    <CertificateWrapper watermark={watermark} watermarkType={watermarkType}>
      <PrintLetterhead />
      <Spacer />
      <PatientDetailsHeader>{header}</PatientDetailsHeader>
      <TwoColumnContainer>
        {detailsFieldsToDisplay.map(field => {
          const accessor = customAccessors[field] || PRIMARY_DETAILS_FIELDS[field];
          const label = getLocalisation(`fields.${field}.shortLabel`) || field;
          const value = (accessor ? accessor(patient) : patient[field]) || '';
          return (
            <p key={field}>
              <span>{`${label}: `}</span>
              <span>{value}</span>
            </p>
          );
        })}
      </TwoColumnContainer>
      <Spacer />
      {children}
      <Spacer />
      <TwoColumnContainer>
        <p>{`Printed by: ${currentUser ? currentUser.displayName : ''}`}</p>
        <p>
          <span>Printing date: </span>
          <DateDisplay date={new Date()} />
        </p>
      </TwoColumnContainer>
      <Spacer />
      {footerImg ? <SizedBase64Image mediaType={footerImgType} data={footerImg} /> : null}
      <Spacer />
      {footer}
      <Spacer />
    </CertificateWrapper>
  );
};
