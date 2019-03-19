import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { DateDisplay } from '../../components/DateDisplay';
import { TopBar, Preloader } from '../../components';
import { LabRequestModel } from '../../models';
import { toTitleCase } from '../../utils';

const Unit = styled.span`
  color: rgba(0, 0, 0, 0.6);
`;

const DataSection = styled.div`
  margin-bottom: 1rem;
`;

const DataLabel = styled.span`
  font-weight: bold;
`;

const DataValue = styled.span`
`;

const DataItem = ({ label, value }) => (
  <li>
    <DataLabel>
      {label}
:
    </DataLabel>
    {' '}
    <DataValue>{value}</DataValue>
  </li>
);

const NoteContent = styled.p`
  font-size: 14pt;
`;

const PLACEHOLDER_PATIENT = {
  attributes: { sex: 'female' },
  getDisplayName: () => 'Joan Smythe',
};

export class LabRequestDisplay extends React.Component {
  state = {
    loading: true,
    patientData: null,
    labRequestData: null,
  }

  async componentDidMount() {
    const { match: { params: { id: labRequestId } } } = this.props;
    const labRequestModel = new LabRequestModel({ _id: labRequestId });
    await labRequestModel.fetch();

    const labRequestData = labRequestModel.toJSON();
    const patientData = labRequestModel.getPatient() || PLACEHOLDER_PATIENT;

    this.setState({
      loading: false,
      labRequestData,
      patientData,
    });
  }

  render() {
    const { loading, labRequestData, patientData } = this.state;
    if (loading) {
      return <Preloader />;
    }

    const patientSex = patientData.attributes.sex;
    const patientIsMale = (patientSex === 'male');
    const getReferenceRange = ({ type }) => {
      const range = (patientIsMale ? type.maleRange : type.femaleRange);
      const { 0: min, 1: max } = (range || {});
      if (min && max) {
        return (
          <span>
            {`${min}–${max} `}
            <Unit>{type.unit}</Unit>
          </span>
        );
      }
      return <span />;
    };

    const tests = labRequestData.tests.map(t => (
      <tr key={t._id}>
        <td>{t.type.name}</td>
        <td>
          {t.result || '– '}
          <Unit>{t.type.unit}</Unit>
        </td>
        <td>{getReferenceRange(t)}</td>
      </tr>
    ));

    return (
      <div className="content">
        <TopBar title="Lab request information" />
        <div className="detail">
          <DataSection>
            <ul>
              <DataItem label="Patient" value={patientData.getDisplayName()} />
              <DataItem label="Requested by" value={labRequestData.requestedBy.displayName} />
              <DataItem label="Status" value={toTitleCase(labRequestData.status)} />
              <DataItem label="Category" value={labRequestData.category.name} />
              <DataItem label="Requested date" value={<DateDisplay date={labRequestData.requestedDate} />} />
              <DataItem label="Sample date" value={<DateDisplay day={labRequestData.sampleDate} />} />
              <DataItem label="Sample ID" value={labRequestData.sampleId || 'processing'} />
            </ul>
          </DataSection>

          <DataSection>
            <h3>Results</h3>
            <table>
              <tbody>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>
Reference (
                    {patientSex}
)
                  </th>
                </tr>
                {tests}
              </tbody>
            </table>
          </DataSection>

          <DataSection>
            <h3>Notes</h3>
            <NoteContent>{labRequestData.notes || 'No notes.'}</NoteContent>
          </DataSection>
        </div>
      </div>
    );
  }
}
