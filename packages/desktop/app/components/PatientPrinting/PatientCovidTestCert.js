import React, { useState, useEffect, useMemo } from 'react';

import { Modal } from '../Modal';
import { Certificate, Table } from '../Print/Certificate';
import { DateDisplay } from '../DateDisplay';
import { getCompletedDate, getMethod, getRequestId, getLaboratory } from '../../utils/lab';

import { connectApi, useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

// The passport number is taken from the COVID Tourism survey
const usePassportNumber = patientId => {
  const SURVEY_ID = 'program-fijicovid19-fijicovidrdt';
  const QUESTION_ID = 'pde-FijCOVRDT002';
  const api = useApi();
  const [value, setValue] = useState(null);

  useEffect(() => {
    (async () => {
      const surveyResponses = await api.get(`patient/${patientId}/programResponses`);
      const surveyResponseId = surveyResponses.data.find(sr => sr.surveyId === SURVEY_ID).id;
      const response = await api.get(`/surveyResponse/${surveyResponseId}`);
      const passportNumber = response.answers.find(a => a.dataElementId === QUESTION_ID);
      setValue(passportNumber.body);
    })();
  }, [api, patientId]);

  return () => value;
};

const DumbPatientCovidTestCert = ({ patient, getLabRequests, getLabTests }) => {
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState([]);
  const { getLocalisation } = useLocalisation();

  const columns = useMemo(
    () => [
      {
        key: 'date-of-swab',
        title: 'Date of swab',
        accessor: ({ sampleTime }) => <DateDisplay date={sampleTime} />,
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
      { key: 'specimenType', title: 'Specimen type' },
    ],
    [],
  );

  useEffect(() => {
    (async () => {
      const response = await getLabRequests();
      const requests = await Promise.all(
        response.data.map(async request => {
          const { data: tests } = await getLabTests(request.id);
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
  }, [columns, getLabRequests, getLabTests]);

  const getPassportNumber = usePassportNumber(patient.id);

  return (
    <Modal open={open} onClose={() => setOpen(false)} width="md" printable>
      <Certificate
        patient={patient}
        header="COVID-19 test history"
        customAccessors={{ passport: getPassportNumber }}
        primaryDetailsFields={[
          'firstName',
          'lastName',
          'dateOfBirth',
          'placeOfBirth',
          'countryOfBirthId',
          'sex',
          'displayId',
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

export const PatientCovidTestCert = connectApi((api, dispatch, { patient }) => ({
  getLabRequests: () =>
    api.get(`/labRequest`, {
      patientId: patient.id,
      category: 'covid',
    }),
  getLabTests: id => api.get(`/labRequest/${id}/tests`),
}))(DumbPatientCovidTestCert);
