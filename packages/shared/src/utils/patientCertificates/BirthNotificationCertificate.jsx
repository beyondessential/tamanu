import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

// @Todo: NASS-997
export const BirthNotificationCertificate = () => {
  return (
    <Document>
      <Page size="A4">
        <View>
          <Text>Birth Notification Certificate</Text>
        </View>
      </Page>
    </Document>
  );
};
