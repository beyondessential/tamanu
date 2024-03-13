import React from 'react';
import { View } from '@react-pdf/renderer';
import { Box, Signature, SigningImage } from './Layout';

export const SigningSection = ({ signingSrc, language }) => (
  <View
    style={{
      flexDirection: 'column',
      justifyContent: 'flex-end',
      flex: 1,
      paddingLeft: 15,
      paddingRight: 15,
    }}
  >
    {signingSrc ? (
      <SigningImage src={signingSrc} />
    ) : (
      <Box mb={0}>
        <Box>
          <Signature text="Authorised by" language={language} />
        </Box>
        <Box mb={10}>
          <Signature text="Signed" language={language} />
        </Box>
        <Box>
          <Signature text="Date" language={language} />
        </Box>
      </Box>
    )}
  </View>
);
