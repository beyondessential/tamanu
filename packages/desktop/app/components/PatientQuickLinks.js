import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Zoom from '@material-ui/core/Zoom';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ButtonBase } from '.';

const FabBottomRight = styled(Fab)`
  position: fixed !important;
  right: 20px !important;
  bottom: 20px !important;
`;

class PatientQuickLinks extends Component {
  state = { anchorEl: null }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { patient } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);
    const { _id: patientId } = patient;

    return (
      <React.Fragment>
        <Zoom in>
          <FabBottomRight color="primary" onClick={this.handleClick}>
            <AddIcon />
          </FabBottomRight>
        </Zoom>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={this.handleClose}
        >
          <MenuItem
            key="quick-links-1"
            component={ ButtonBase }
            to={`/appointments/appointmentByPatient/${patientId}`}
            can={{ do: 'create', on: 'appointment '}}
          >Appointment</MenuItem>
          <MenuItem
            key="quick-links-2"
            component={ ButtonBase }
            to={`/patients/visit/${patientId}`}
            can={{ do: 'create', on: 'visit '}}
          >Visit</MenuItem>
          <MenuItem
            key="quick-links-3"
            component={ ButtonBase }
            to={`/medication/request/by-patient/${patientId}`}
            can={{ do: 'create', on: 'medication '}}
          >Medication</MenuItem>
          <MenuItem
            key="quick-links-4"
            component={ ButtonBase }
            can={{ do: 'create', on: 'imaging '}}
          >Imaging</MenuItem>
          <MenuItem
            key="quick-links-5"
            component={ ButtonBase }
            can={{ do: 'create', on: 'lab '}}
          >Lab</MenuItem>
        </Menu>
      </React.Fragment>
    );
  }
};

PatientQuickLinks.propTypes = {
  patient: PropTypes.object.isRequired,
};

export default PatientQuickLinks;