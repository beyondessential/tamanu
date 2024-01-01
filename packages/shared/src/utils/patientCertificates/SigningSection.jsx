import React from 'react';
import { Box, Row, Signature, SigningImage } from './Layout';

export const SigningSection = ({ signingSrc }) => (
  <Row>
    {signingSrc ? (
      <SigningImage src={signingSrc} />
    ) : (
      <Box mb={0}>
        <Box>
          <Signature text="Authorised by" />
        </Box>
        <Box mb={10}>
          <Signature text="Signed" />
        </Box>
        <Box>
          <Signature text="Date" />
        </Box>
      </Box>
    )}
  </Row>
);
