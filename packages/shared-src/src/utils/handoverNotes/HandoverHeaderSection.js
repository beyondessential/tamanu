import React from 'react';
import { getDisplayDate } from 'shared/utils/patientCertificates/getDisplayDate';
import { Box, Logo } from '../patientCertificates/Layout';
import { H1, H3 } from '../patientCertificates/Typography';
import { Divider } from './Divider';

export const HandoverHeaderSection = ({ getLocalisation, logoSrc, locationGroupName }) => {
  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');
  return (
    <>
      {logoSrc && <Logo logoSrc={logoSrc} />}
      <Box
        style={{
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: '0',
          width: '100%',
        }}
      >
        <H3
          style={{
            textAlign: 'right',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {title}
        </H3>
        <H3
          style={{
            textAlign: 'right',
            fontWeight: 'bold',
          }}
        >
          {subTitle}
        </H3>
        <H1
          style={{
            textAlign: 'right',
            fontSize: 18,
            marginBottom: 5,
            marginTop: 0,
          }}
        >
          Handover notes
        </H1>
        <H1
          style={{
            textAlign: 'right',
            fontSize: 17,
            marginTop: 0,
          }}
        >
          {locationGroupName} | {getDisplayDate(new Date(), 'dd/MM/yy hh:mm a')}
        </H1>
      </Box>
      <Divider />
    </>
  );
};
