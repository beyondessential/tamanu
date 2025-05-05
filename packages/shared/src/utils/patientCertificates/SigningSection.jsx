import React from 'react';
import { View } from '@react-pdf/renderer';
import { Box, Signature, SigningImage } from './Layout';
import { useLanguageContext } from '../pdf/languageContext';

export const SigningSection = ({ signingSrc, style, ...props }) => {
  const { getTranslation } = useLanguageContext();

  return (
    <View
      style={{
        flexDirection: 'column',
        justifyContent: 'flex-end',
        flex: 1,
        paddingLeft: 15,
        paddingRight: 15,
        ...style,
      }}
      {...props}
    >
      {signingSrc ? (
        <SigningImage src={signingSrc} />
      ) : (
        <Box mb={0}>
          <Box>
            <Signature text={getTranslation('pdf.signature.authorisedBy', 'Authorised by')} />
          </Box>
          <Box mb={10}>
            <Signature text={getTranslation('pdf.signature.signed', 'Signed')} />
          </Box>
          <Box>
            <Signature text={getTranslation('pdf.signature.date', 'Date')} />
          </Box>
        </Box>
      )}
    </View>
  );
};
