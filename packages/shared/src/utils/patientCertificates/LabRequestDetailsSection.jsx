import React from 'react';

import { LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants';

import { Col, Row } from './Layout';
import { P } from './Typography';
import { DataItem } from './printComponents/DataItem';
import { PrintableBarcode } from './printComponents/PrintableBarcode';
import { useLanguageContext } from '../pdf/languageContext';
import { useDateTime } from '../pdf/withDateTimeContext';

export const SampleDetailsRow = ({ request }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShortDateTime } = useDateTime();
  return (
    <Row>
      <Col>
        <DataItem
          label={getTranslation('lab.sampleDateTime.label', 'Sample date & time')}
          value={formatShortDateTime(request.sampleTime)}
        />
        <DataItem
          label={getTranslation('lab.collectedBy.label', 'Collected by')}
          value={request.collectedBy?.displayName}
        />
      </Col>
      <Col>
        <DataItem label={getTranslation('lab.site.label', 'Site')} value={request.site?.name} />
        <DataItem
          label={getTranslation('lab.specimenType.label', 'Specimen type')}
          value={request.specimenType?.name}
        />
      </Col>
    </Row>
  );
};

export const PublishedDetailsRow = ({ request }) => {
  const { getEnumTranslation, getTranslation } = useLanguageContext();
  const { formatShortDateTime } = useDateTime();
  const notApplicable = getTranslation('general.fallback.notApplicable', 'N/A', {
    casing: 'lower',
  });
  return (
    <Row>
      <Col>
        <DataItem
          label={getTranslation('lab.publishedDate.label', 'Published date & time')}
          value={request.publishedDate ? formatShortDateTime(request.publishedDate) : notApplicable}
        />
        <DataItem
          label={getTranslation('lab.publishedBy.label', 'Published by')}
          value={request.publishedBy?.displayName ?? notApplicable}
        />
      </Col>
      <Col>
        <DataItem
          label={getTranslation('general.status.label', 'Status')}
          value={getEnumTranslation(LAB_REQUEST_STATUS_LABELS, request.status)}
        />
      </Col>
    </Row>
  );
};

export const MinimalLabRequestDetailsSection = ({ request }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShortDateTime } = useDateTime();
  return (
    <Row>
      <Col>
        <DataItem
          label={getTranslation('lab.requestId.label', 'Request ID')}
          value={request.displayId}
        />
        <DataItem
          label={getTranslation('general.requestedBy.label', 'Requested by')}
          value={request.requestedBy?.displayName}
        />
      </Col>
      <Col>
        <DataItem
          label={getTranslation('general.requestedDate.label', 'Requested date & time')}
          value={formatShortDateTime(request.requestedDate)}
        />
      </Col>
    </Row>
  );
};

export const FullLabRequestDetailsSection = ({ request }) => {
  const { getTranslation } = useLanguageContext();
  const { formatShortDateTime } = useDateTime();
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
          <DataItem
            label={getTranslation('lab.requestId.label', 'Request ID')}
            value={request.displayId}
          />
          <DataItem
            label={getTranslation('general.requestedBy.label', 'Requested by')}
            value={request.requestedBy?.displayName}
          />
          <DataItem
            label={getTranslation('lab.priority.label', 'Priority')}
            value={request.priority?.name}
          />
          <DataItem
            label={getTranslation('general.requestedDate.label', 'Requested date & time')}
            value={formatShortDateTime(request.requestedDate)}
          />
          <DataItem
            label={getTranslation('lab.testCategory.label', 'Test category')}
            value={request.category?.name}
          />
          <DataItem
            label={getTranslation('lab.tests.label', 'Tests')}
            value={labTestTypeAccessor(request)}
          />
        </Col>
        <Col>
          <Row>
            <P mt={9} fontSize={9} bold>
              {getTranslation('lab.requestIdBarcode.label', 'Request ID barcode:')}
            </P>
            <PrintableBarcode id={request.displayId} />
          </Row>
        </Col>
      </Row>
      <Row>
        <DataItem
          label={getTranslation('general.notes.label', 'Notes')}
          value={notesAccessor(request)}
        />
      </Row>
    </>
  );
};
