import React from 'react';

import { StyleSheet, View } from '@react-pdf/renderer';
import { Col, Row } from './Layout';
import { P } from './Typography';
import { DataItem } from './printComponents/DataItem';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { HorizontalRule } from './printComponents/HorizontalRule';
import { getDisplayDate } from './getDisplayDate';
import { DoubleHorizontalRule } from './printComponents/DoubleHorizontalRule';
import { LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';
import { useLanguageContext } from '../pdf/languageContext';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';
const headingFontSize = 11;
const textFontSize = 9;

const labDetailsSectionStyles = StyleSheet.create({
  barcodeLabelText: {
    marginTop: 9,
  },
  divider: {
    borderBottom: '2px solid black',
    marginVertical: '10px',
  },
  detailsContainer: {
    marginBottom: 5,
  },
});

const SampleDetailsRow = ({ request }) => (
  <Row>
    <Col>
      <DataItem
        label="Sample date & time"
        value={getDisplayDate(request.sampleTime, DATE_TIME_FORMAT)}
      />
      <DataItem label="Collected by" value={request.collectedBy?.displayName} />
    </Col>
    <Col>
      <DataItem label="Site" value={request.site?.name} />
      <DataItem label="Specimen type" value={request.specimenType?.name} />
    </Col>
  </Row>
);

const PublishedDetailsRow = ({ request }) => {
  const { getEnumTranslation } = useLanguageContext();
  return (
    <Row>
      <Col>
        <DataItem
          label="Published date & time"
          value={getDisplayDate(request.publishedDate, DATE_TIME_FORMAT)}
        />
        {/* TODO: this aint a thing */}
        <DataItem label="Published by" value={request.publishedBy?.displayName} />
      </Col>
      <Col>
        <DataItem
          label="Status"
          value={getEnumTranslation(LAB_REQUEST_STATUS_LABELS, request.status)}
        />
      </Col>
    </Row>
  );
};

const MinimalLabRequestDetailsRow = ({ request }) => (
  <Row>
    <Col>
      <DataItem label="Request ID" value={request.displayId} />
      <DataItem label="Requested by" value={request.requestedBy?.displayName} />
    </Col>
    <Col>
      <DataItem
        label="Requested date & time"
        value={getDisplayDate(request.requestedDate, DATE_TIME_FORMAT)}
      />
    </Col>
  </Row>
);

const FullLabRequestDetailsRow = ({ request }) => {
  const labTestTypeAccessor = ({ labTestPanelRequest, tests }) => {
    if (labTestPanelRequest) {
      return labTestPanelRequest.labTestPanel.name;
    }
    return tests?.map(test => test.labTestType?.name).join(', ') || '';
  };

  const notesAccessor = ({ notes }) => {
    return (
      notes
        ?.map(note => note?.content || '')
        .filter(Boolean)
        .join(',\n') || ''
    );
  };

  return (
    <>
      <Row>
        <Col>
          <DataItem label="Request ID" value={request.displayId} />
          <DataItem label="Requested by" value={request.requestedBy?.displayName} />
          <DataItem label="Test category" value={request.category?.name} />
          <DataItem label="Tests" value={labTestTypeAccessor(request)} />
        </Col>
        <Col>
          <Row>
            <P style={labDetailsSectionStyles.barcodeLabelText} fontSize={textFontSize} bold>
              Request ID barcode:
            </P>
            <PrintableBarcode id={request.displayId} />
          </Row>
        </Col>
      </Row>
      <Row>
        <DataItem label="Notes" value={notesAccessor(request)} />
      </Row>
    </>
  );
};

export const LabRequestDetailsView = ({
  labRequests,
  showFullRequestDetails = true,
  showPublishedDetails = false,
}) => {
  return (
    <View>
      <P bold fontSize={headingFontSize} mb={3}>
        Lab request details
      </P>
      <HorizontalRule />
      {labRequests.map((request, index) => {
        return (
          <View key={request.id} style={labDetailsSectionStyles.detailsContainer}>
            {showFullRequestDetails ? (
              <FullLabRequestDetailsRow request={request} />
            ) : (
              <MinimalLabRequestDetailsRow request={request} />
            )}
            <HorizontalRule />
            <SampleDetailsRow request={request} />
            {showPublishedDetails && (
              <>
                <HorizontalRule />
                <PublishedDetailsRow request={request} />
              </>
            )}
            {index < labRequests.length - 1 && <View style={labDetailsSectionStyles.divider} />}
          </View>
        );
      })}
      <DoubleHorizontalRule />
    </View>
  );
};
