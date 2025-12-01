import React from 'react';

import { Col, Row } from './Layout';
import { P } from './Typography';
import { DataItem } from './printComponents/DataItem';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { getDisplayDate } from './getDisplayDate';
import { LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';
import { useLanguageContext } from '../pdf/languageContext';

const DATE_TIME_FORMAT = 'dd/MM/yyyy h:mma';

export const SampleDetailsRow = ({ request }) => (
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

export const PublishedDetailsRow = ({ request }) => {
  const { getEnumTranslation } = useLanguageContext();
  return (
    <Row>
      <Col>
        <DataItem
          label="Published date & time"
          value={getDisplayDate(request.publishedDate, DATE_TIME_FORMAT)}
        />
        <DataItem label="Published by" value={request.publishedBy?.displayName ?? 'n/a'} />
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

export const MinimalLabRequestDetailsSection = ({ request }) => (
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

export const FullLabRequestDetailsSection = ({ request }) => {
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
          <DataItem label="Priority" value={request.priority?.name} />
          <DataItem
            label="Requested date & time"
            value={getDisplayDate(request.requestedDate, DATE_TIME_FORMAT)}
          />
          <DataItem label="Test category" value={request.category?.name} />
          <DataItem label="Tests" value={labTestTypeAccessor(request)} />
        </Col>
        <Col>
          <Row>
            <P mt={9} fontSize={9} bold>
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
