import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { useApi } from '../../api';
import { getCurrentUser } from '../../store/auth';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { PrintLetterhead } from './Letterhead';
import { DateDisplay } from '../DateDisplay';

const FOOTER_IMG_ASSET_NAME = 'certificate-bottom-half-img';

export const Spacer = styled.div`
  margin-top: 3rem;
`;

export const Table = styled.table`
  border: 1px solid ${Colors.darkText};
  border-collapse: collapse;

  thead {
    font-weight: bold;
  }
  th,
  td {
    padding: 5px 10px;
    border: 1px solid ${Colors.darkText};
  }
`;
const PatientDetailsHeader = styled.strong`
  text-decoration: underline;
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
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  Mother: () => null, // TODO: not populated
  displayId: null,
};

const Base64Image = ({ data, mediaType = 'image/jpeg', ...props }) => (
  <img {...props} src={`data:${mediaType};base64,${data}`} alt="" />
);

const SizedBase64Image = styled(Base64Image)`
  width: 100%;
  height: 100%;
  object-fit: scale-down;
`;
const UnderlineP = styled.p`
  text-decoration: underline;
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
          const accessor = PRIMARY_DETAILS_FIELDS[field];
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
