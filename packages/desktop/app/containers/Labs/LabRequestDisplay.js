import React from 'react';
import styled from 'styled-components';
import {
  ListItem, Typography, Table, TableBody, TableRow,
  TableCell, TableHead, Grid,
} from '@material-ui/core';
import {
  DateDisplay, Container, TopBar, Preloader, BackButton,
} from '../../components';
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
  display: inline-block;
  padding-right: 4px;
`;

const DataValue = styled.span`
`;

const StyledListItem = styled(ListItem)`
  padding-left: 0 !important;
`;

const StyledTableHead = styled(TableHead)`
  th {
    font-size: 1.1rem;
    font-weight: 500;
  }
`;

const DataItem = ({ label, value }) => (
  <StyledListItem component="div">
    <DataLabel>
      {label}
    </DataLabel>
    <DataValue>
      {value}
    </DataValue>
  </StyledListItem>
);

const NoteContent = styled.p`
  font-size: 1rem;
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
      <TableRow key={t._id}>
        <TableCell>
          {t.type.name}
        </TableCell>
        <TableCell>
          {t.result || '– '}
          <Unit>{t.type.unit}</Unit>
        </TableCell>
        <TableCell>
          {getReferenceRange(t)}
        </TableCell>
      </TableRow>
    ));

    return (
      <React.Fragment>
        <TopBar title="Lab request information" />
        <Container>
          <DataSection>
            <DataItem label="Patient" value={patientData.getDisplayName()} />
            <DataItem label="Requested by" value={labRequestData.requestedBy.displayName} />
            <DataItem label="Status" value={toTitleCase(labRequestData.status)} />
            <DataItem label="Category" value={labRequestData.category.name} />
            <DataItem label="Requested date" value={<DateDisplay date={labRequestData.requestedDate} />} />
            <DataItem label="Sample date" value={<DateDisplay day={labRequestData.sampleDate} />} />
            <DataItem label="Sample ID" value={labRequestData.sampleId || 'processing'} />
          </DataSection>

          <DataSection>
            <Typography variant="h6">
              Results
            </Typography>
            <Table>
              <StyledTableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>
                    {`Reference (${patientSex})`}
                  </TableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {tests}
              </TableBody>
            </Table>
          </DataSection>

          <DataSection>
            <Typography variant="h6">
              Notes
            </Typography>
            <NoteContent>{labRequestData.notes || 'No notes.'}</NoteContent>
          </DataSection>
          <Grid container item style={{ paddingTop: 16 }}>
            <BackButton />
          </Grid>
        </Container>
      </React.Fragment>
    );
  }
}
