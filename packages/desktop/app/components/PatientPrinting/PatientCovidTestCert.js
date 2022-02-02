import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { ICAO_DOCUMENT_TYPES } from 'shared/constants';
import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';
import { DateDisplay } from '../DateDisplay';
import {
  getCompletedDate,
  getMethod,
  getRequestId,
  getLaboratory,
  getRequestedBy,
} from '../../utils/lab';

import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { EmailButton } from '../Email/EmailButton';

const usePassportNumber = patientId => {
  const api = useApi();
  const [value, setValue] = useState(null);

  useEffect(() => {
    (async () => {
      const passportNumber = await api.get(`patient/${patientId}/passportNumber`);
      setValue(passportNumber);
    })();
  }, [api, patientId]);

  return () => value;
};

const useNationality = patientId => {
  const api = useApi();
  const [value, setValue] = useState(null);

  useEffect(() => {
    (async () => {
      const nationality = await api.get(`patient/${patientId}/nationality`);
      setValue(nationality);
    })();
  }, [api, patientId]);

  return () => value;
};

export const PatientCovidTestCert = ({ patient }) => {
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState([]);
  const { getLocalisation } = useLocalisation();
  const api = useApi();

  const createCovidTestCertNotification = useCallback(
    data => {
      api.post('certificateNotification', {
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
        requireSigning: false,
        patientId: patient.id,
        forwardAddress: data.email,
      });
    },
    [api, patient],
  );

  const columns = useMemo(
    () => [
      {
        key: 'date-of-swab',
        title: 'Date of swab',
        accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} />,
      },
      {
        key: 'time-of-swab',
        title: 'Time of swab',
        accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} showDate={false} showTime />,
      },
      {
        key: 'requestedBy',
        title: 'Requested By',
        accessor: getRequestedBy,
      },
      {
        key: 'date-of-test',
        title: 'Date of test',
        accessor: getCompletedDate,
      },
      {
        key: 'laboratory',
        title: 'Laboratory',
        accessor: getLaboratory,
      },
      {
        key: 'requestId',
        title: 'Request ID',
        accessor: getRequestId,
      },
      {
        key: 'method',
        title: 'Method',
        accessor: getMethod,
      },
      {
        key: 'result',
        title: 'Result',
      },
      {
        key: 'specimenType',
        title: 'Specimen type',
        accessor: ({ labTestType }) => labTestType.name,
      },
    ],
    [],
  );

  useEffect(() => {
    (async () => {
      const response = await api.get(`labRequest`, {
        patientId: patient.id,
        category: 'covid',
      });
      const requests = await Promise.all(
        response.data.map(async request => {
          const { data: tests } = await api.get(`labRequest/${request.id}/tests`);
          return {
            ...request,
            ...tests[0],
          };
        }),
      );
      setRows(
        requests.map(request => ({
          rowId: request.id,
          cells: columns.map(({ key, accessor }) => ({
            key,
            value: accessor ? React.createElement(accessor, request) : request[key],
          })),
        })),
      );
    })();
  }, [columns, api, patient.id]);

  const getPassportNumber = usePassportNumber(patient.id);
  const getNationality = useNationality(patient.id);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      additionalActions={<EmailButton onEmail={createCovidTestCertNotification} />}
    >
      <Certificate
        patient={patient}
        header="COVID-19 test history"
        customAccessors={{ passport: getPassportNumber, nationalityId: getNationality }}
        primaryDetailsFields={[
          'firstName',
          'lastName',
          'dateOfBirth',
          'sex',
          'displayId',
          'nationalityId',
          'passport',
        ]}
      >
        <Table>
          <thead>
            <tr>
              {columns.map(({ title, key }) => (
                <th key={key}>{title || getLocalisation(`fields.${key}.shortLabel`) || key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              return (
                <tr key={row.rowId}>
                  {row.cells.map(({ key, value }) => (
                    <td key={key}>{value}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Certificate>
    </Modal>
  );
};
