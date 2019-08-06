import React, { Component } from 'react';
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import Select from 'react-select';
import BootstrapTable from 'react-bootstrap-table-next';
import CustomDateInput from '../../components/CustomDateInput';
import { fetchPatients } from '../../actions/patients/patients';
import { patientColumns, reportOptions } from '../../constants';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

const CreateContent = styled.div`
  height: 100vh;
  font-size: 15px;
`;
const CreateTopBar = styled.div`
  margin: 0 auto;
  border-bottom: 1px solid #d2dae3;
  background: ${props => props.theme.palette.background.paper};
  padding: 0 15px;
  height: 55px;
  > span {
    float: left;
    margin: 0;
    line-height: 55px;
    letter-spacing: -1px;
    color: ${props => props.theme.palette.primary.textMedium};
    font-size: 28px;
    font-weight: 600;
  }
`;
const ViewActionButtons = styled.div`
  float: right;
`;
const Column = styled.div`
  padding: 0rem;
`;
const Columns = styled.div`
  margin-left: 0 !important;
  margin-right: 0 !important;
`;
const Header = styled.div`
  color: ${props => props.theme.palette.primary.textMedium};
  display: inline-block;
  margin-bottom: 5px;
  font-weight: bold;
`;
const FormHeader = styled.div`
  padding: 10px;
  background: #428bca;
  span {
    color: ${props => props.theme.palette.primary.textLight};
    font-size: 24px;
    font-weight: bold;
  }
`;
const FormTable = styled.div`
  margin: 20px 20px;
  background: white;
  .table {
    width: 100%;
  }
`;
const CreateForm = styled.div`
  margin: 20px 20px;
  background: white;
  table {
    width: 100%;
  }
`;
const PrimaryButton = styled.button`
  border: 0.5px solid #333 !important;
`;

class Reports extends Component {
  state = {
    startDate: moment(),
    endDate: moment(),
    selectValue: '',
    generated: false,
  };

  componentDidMount() {
    this.props.fetchPatients();
  }

  onChangeStartDate = date => {
    this.setState({
      startDate: date,
    });
  };

  onChangeEndDate = date => {
    this.setState({
      endDate: date,
    });
  };

  updateValue = newValue => {
    this.setState({
      selectValue: newValue,
    });
  };

  generateReport = () => {
    this.setState({ generated: true });
  };

  render() {
    const { startDate, endDate, generated } = this.state;
    const { patients } = this.props;
    return (
      <CreateContent>
        <CreateTopBar>
          <span>Patient Report</span>
          <ViewActionButtons>
            <button>Patient Check In</button>
          </ViewActionButtons>
        </CreateTopBar>
        <div>
          <CreateForm>
            <Columns>
              <Column>
                <Column>
                  <Header>Report Type</Header>
                  <Select
                    id="state-select"
                    ref={ref => {
                      this.select = ref;
                    }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={reportOptions}
                    simpleValue
                    clearable
                    name="selected-state"
                    disabled={this.state.disabled}
                    value={this.state.selectValue}
                    onChange={this.updateValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </Column>
              </Column>
            </Columns>
            <Columns>
              <Column>
                <Column>
                  <Header>Start Date</Header>
                  <DatePicker
                    name="startDate"
                    customInput={<CustomDateInput />}
                    selected={startDate}
                    onChange={this.onChangeStartDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Column>
              </Column>
              <Column>
                <Column>
                  <Header>End Date</Header>
                  <DatePicker
                    name="endDate"
                    customInput={<CustomDateInput />}
                    selected={endDate}
                    onChange={this.onChangeEndDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </Column>
              </Column>
            </Columns>
            <Column>
              <PrimaryButton onClick={this.generateReport}>
                Generate Report
              </PrimaryButton>
            </Column>
          </CreateForm>
          {generated && (
            <CreateForm>
              <FormHeader>
                <span>
                  Diagnostic Testing Report {moment(startDate).format('MM/DD/YYYY')} -{' '}
                  {moment(endDate).format('MM/DD/YYYY')}
                </span>
              </FormHeader>
              <Columns>
                <FormTable>
                  <BootstrapTable
                    keyField="id"
                    data={patients}
                    columns={patientColumns}
                    defaultSortDirection="asc"
                  />
                  <Column>
                    <PrimaryButton onClick={this.generateReport}>
                      Export Report
                    </PrimaryButton>
                  </Column>
                </FormTable>
              </Columns>
            </CreateForm>
          )}
        </div>
      </CreateContent>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.patients.patients,
  };
}

const mapDispatchToProps = dispatch => ({
  fetchPatients: () => dispatch(fetchPatients()),
});

export default withTheme()(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(Reports),
);
