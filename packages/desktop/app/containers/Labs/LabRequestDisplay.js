import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { DateDisplay } from '../../components/DateDisplay';
import { TopBar } from '../../components';
import { LabRequestModel } from '../../models';

const Unit = styled.span`
  color: rgba(0, 0, 0, 0.6);
`;

const DataSection = styled.div`
  margin-bottom: 1rem;
`;

const NoteContent = styled.p`
  font-size: 14pt;
`;

export class LabRequestDisplay extends React.Component {

  state = {
    loading: true,
    data: null,
  }
  
  async componentDidMount() {
    const { match: { params: { id: labRequestId } } } = this.props;
    const model = new LabRequestModel({ _id: labRequestId });
    await model.fetch();

    console.log(model.toJSON());
    this.setState({ 
      loading: false,
      data: model.toJSON(),
    });
  }

  render() {
    const { loading, data } = this.state;
    if(loading) {
      return <div>Loading...</div>;
    }

    const patient = {
      sex: "female",
      firstName: "Joan",
      lastName: "Smythe",
    };

    const patientIsMale = (patient.sex === "male");
    const getReferenceRange = ({type}) => {
      const range = (patientIsMale ? type.maleRange : type.femaleRange);
      const { 0: min, 1: max } = (range || {});
      if(min && max) {
        return <span>{`${min}–${max} `}<Unit>{type.unit}</Unit></span>
      } else {
        return <span></span>;
      }
    };

    const tests = data.tests.map(t => (
      <tr key={t._id}>
        <td>{t.type.name}</td>
        <td>{t.result || "– "}<Unit>{t.type.unit}</Unit></td>
        <td>{getReferenceRange(t)}</td>
      </tr>
    ));

    return (
      <div className="content">
        <TopBar title="Lab request information" />
        <div className="detail">
          <DataSection>
            <ul>
              <li>Patient: {patient.firstName} {patient.lastName}</li>
              <li>Requested by: {data.requestedBy.displayName}</li>
              <li>Status: {data.status}</li>
              <li>Category: {data.category.name}</li>
              <li>Requested date: <DateDisplay date={data.requestedDate}/></li>
              <li>Sample date: <DateDisplay date={data.sampleDate}/></li>
            </ul>
          </DataSection>

          <DataSection>
            <h3>Results</h3>
            <table>
              <tbody>
                <tr>
                  <th>Test</th><th>Result</th><th>Reference ({patient.sex})</th>
                </tr>
                {tests}
              </tbody>
            </table>
          </DataSection>

          <DataSection>
            <h3>Notes</h3>
            <NoteContent>{data.notes || "No notes."}</NoteContent>
          </DataSection>
        </div>
      </div>
    );
  }

}
