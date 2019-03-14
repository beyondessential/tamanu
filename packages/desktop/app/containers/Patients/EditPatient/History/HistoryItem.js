import React, { Component } from 'react';
import { Grid, ListItem, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import { DateDisplay } from '../../../../components';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';

const styles = ({ spacing }) => {
  const defaultPadding = `${spacing.unit / 2}px ${spacing.unit * 2}px`;
  return {
    list: {
      flexGrow: 1,
      backgroundColor: grey[200],
      marginTop: spacing.unit * 2,
      padding: 0,
      fontSize: 2,
    },
    date: {
      backgroundColor: grey[400],
      padding: defaultPadding,
      display: "flex",
      alignItems: 'center',
      "& abbr": {
        textDecoration: 'none',
      }
    },
    captionText: {
      color: grey[400],
      padding: defaultPadding,
      display: "flex",
      alignItems: 'center',
    },
    titleText: {
      padding: defaultPadding,
    },
    procedures: {
      padding: spacing.unit,
      backgroundColor: grey[100],
    }
  };
}

const Procedures = ({ classes, _id: visitId, procedures, patientId }) => (
  <Grid container className={classes.procedures} spacing={8}>
    {procedures.map(procedure => (
      <Grid item key={procedure._id}>
        <Typography variant="button">
          Procedure
        </Typography>
        <Link to={`/patients/visit/${patientId}/${visitId}/procedure/${procedure._id}`}>
          <Typography variant="subtitle1">
            <Grid container spacing={8}>
              <Grid item>
                <DateDisplay date={procedure.procedureDate} />
              </Grid>
              <Grid item>
                {procedure.description}
              </Grid>
            </Grid>
          </Typography>
        </Link>
      </Grid>
    ))}
  </Grid>
)

const Item = ({ classes, onClick, date, startDate, endDate, caption, title }) => (
  <ListItem
    component={'div'}
    className={classes.list}
    disableGutters
    button
    onClick={onClick}
  >
    <Grid container>
      <Grid item className={classes.date}>
        <Typography variant="subtitle1">
          <DateDisplay date={startDate || date} />
          {endDate &&
            <React.Fragment>
              <span> - </span>
              <DateDisplay date={endDate} />
            </React.Fragment>
          }
        </Typography>
      </Grid>
      <Grid item xs className={classes.titleText}>
        <Typography variant="subtitle1">{title}</Typography>
      </Grid>
      <Grid item className={classes.captionText}>
        <Typography variant="button" color="inherit">{caption}</Typography>
      </Grid>
    </Grid>
  </ListItem>
)

class HistoryItem extends Component {
  gotoLink(link) {
    this.props.history.push(link);
  }

  render() {
    const { item, patientId, changeTab, ...props } = this.props;
    switch (props.objectType) {
      case 'visit':
        return (
          <React.Fragment>
            <Item
              {...props}
              title={capitalize(item.visitType)}
              caption="Visit"
              startDate={item.startDate}
              endDate={item.endDate}
              onClick={() => this.gotoLink(`/patients/visit/${patientId}/${item._id}`)}
            />
            <Procedures
              {...item}
              classes={props.classes}
              patientId={patientId}
            />
          </React.Fragment>
        );
      case 'medication':
        return (
          <Item
            {...props}
            title={item.drug.name}
            caption="Medication"
            startDate={item.prescriptionDate}
            endDate={item.endDate}
            onClick={() => changeTab('medication')}
          />
        );
      case 'imagingRequest':
        return (
          <Item
            {...props}
            title={item.type.name}
            caption="Imaging"
            date={item.requestedDate}
            onClick={() => this.gotoLink(`/imaging/request/${item._id}`)}
          />
        );
      case 'labRequest':
        return (
          <Item
            {...props}
            date={item.requestedDate}
            title={item.category.name}
            caption="Lab"
            onClick={() => this.gotoLink(`/labs/request/${item._id}`)}
          />
        );
      case 'appointment':
        return (
          <Item
            {...props}
            title={capitalize(item.appointmentType)}
            caption="Appointment"
            startDate={item.startDate}
            endDate={item.endDate}
            onClick={() => this.gotoLink(`/appointments/appointment/${item._id}`)}
          />
        );
    }
  }
}

export default withStyles(styles)(HistoryItem);