import React from 'react';
import { View } from '@react-pdf/renderer';
import { Col, Signature } from './Layout';
import { P } from './Typography';
import { CustomStyleSheet } from '../renderPdf';

const signingSectionStyles = CustomStyleSheet.create({
  underlinedText: {
    textDecoration: 'underline',
  },
  signatureView: {
    paddingRight: 32,
  },
});

export const BaseSigningSection = ({ title }) => (
  <Col>
    {title && (
      <P bold style={signingSectionStyles().underlinedText}>
        {title}
      </P>
    )}
    <View style={signingSectionStyles().signatureView}>
      <Signature text={'Signed'} fontSize={9} lineThickness={0.5} />
      <Signature text={'Date'} fontSize={9} lineThickness={0.5} />
    </View>
  </Col>
);
