import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { pregnancyColumns, PREGNANCY_PROGRAM_ID } from '../../../constants';
import PregnancyModal from '../components/PregnancyModal';
import {
  Button, TabHeader, NewButton, ButtonGroup, ClientSideTable,
} from '../../../components';

export default class Pregnancy extends Component {
  state = {
    modalVisible: false,
    action: 'new',
    item: null,
  }

  onCloseModal = () => {
    this.setState({ modalVisible: false });
  }

  viewPatient = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  editItem = (row) => {
    const { pregnancies: pregnanciesCollection } = this.props.patientModel.attributes;
    const item = pregnanciesCollection.findWhere({ _id: row.original._id });
    this.setState({ modalVisible: true, action: 'edit', item });
  }

  setActionsCol = (row) => {
    const { patient } = this.props;
    const item = row.original;
    return (
      <ButtonGroup>
        {item.child
          && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => this.viewPatient(item.child.id)}
          >
            View Child
          </Button>
          )
        }
        {item.child
          && (
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() => this.viewPatient(item.father.id)}
          >
            View Father
          </Button>
          )
        }
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={() => this.editItem(row)}
        >
          Edit Pregnancy
        </Button>
        <Button
          color="primary"
          variant="contained"
          size="small"
          to={`/programs/${PREGNANCY_PROGRAM_ID}/${patient._id}/surveys/module/${item._id}`}
        >
          Add Form
        </Button>
        <Button
          color="primary"
          variant="contained"
          size="small"
          to={`/programs/${PREGNANCY_PROGRAM_ID}/${patient._id}/surveys/module/${item._id}`}
          disabled={item.surveyResponses.length <= 0}
        >
          View Forms
        </Button>
      </ButtonGroup>
    );
  }

  render() {
    const { patient, patientModel } = this.props;
    const pregnancies = patientModel.getPregnancies();
    const {
      modalVisible,
      action,
      item,
    } = this.state;

    // Set actions col for our table
    const lastCol = pregnancyColumns[pregnancyColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    return (
      <Grid container>
        <TabHeader>
          <NewButton
            onClick={() => this.setState({ modalVisible: true, action: 'new', item: null })}
          >
            Add Pregnancy
          </NewButton>
        </TabHeader>
        <Grid container item>
          <ClientSideTable
            data={pregnancies}
            columns={pregnancyColumns}
            emptyNotification="No pregnancies found."
          />
        </Grid>
        <PregnancyModal
          item={item}
          patient={patient}
          patientModel={patientModel}
          action={action}
          isVisible={modalVisible}
          onClose={this.onCloseModal}
          little
        />
      </Grid>
    );
  }
}
