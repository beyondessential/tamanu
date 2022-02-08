import React from 'react';
import { PaginatedForm } from '../components/Field/PaginatedForm';

const formComponents = [
  {
    id: 'causeOfDeath',
    screenIndex: 0,
    componentIndex: 0,
    text: 'Cause Of Death',
    dataElement: {
      id: 'causeOfDeath',
      name: 'causeOfDeath',
      type: 'FreeText',
    },
  },
  {
    id: 'causeOfDeathInterval',
    screenIndex: 0,
    componentIndex: 1,
    text: 'Time between onset and death',
    dataElement: {
      id: 'causeOfDeathInterval',
      name: 'causeOfDeathInterval',
      type: 'Number',
    },
  },
  {
    id: 'causeOfDeath2',
    screenIndex: 0,
    componentIndex: 2,
    text: 'Due to (or as a concequence of)',
    dataElement: {
      id: 'causeOfDeath2',
      name: 'causeOfDeath2',
      type: 'FreeText',
    },
  },
  {
    id: 'causeOfDeath2Interval',
    screenIndex: 0,
    componentIndex: 3,
    text: 'Time between onset and death',
    dataElement: {
      id: 'causeOfDeath2Interval',
      name: 'causeOfDeath2Interval',
      type: 'Number',
    },
  },
  {
    id: 'surgeryInLast4Weeks',
    screenIndex: 1,
    componentIndex: 0,
    text: 'Was surgery performed in the last 4 weeks?',
    dataElement: {
      id: 'surgeryInLast4Weeks',
      name: 'surgeryInLast4Weeks',
      type: 'FreeText',
    },
  },
  {
    id: 'mannerOfDeath',
    screenIndex: 2,
    componentIndex: 0,
    text: 'What was the manner of death?',
    dataElement: {
      id: 'mannerOfDeath',
      name: 'mannerOfDeath',
      type: 'FreeText',
    },
  },
];
export const DeathForm = ({ onCancel, onSubmit }) => {
  return <PaginatedForm onSubmit={onSubmit} onCancel={onCancel} components={formComponents} />;
};
