import React from 'react';
import { Text } from 'react-native';
import { CenterView } from '../../styled/common';

export const Home = React.memo(() => {
  return (
    <CenterView>
      <Text>Home</Text>
    </CenterView>
  );
});

export const Reports = React.memo(() => {
  return (
    <CenterView>
      <Text>Reports</Text>
    </CenterView>
  );
});

export const SyncData = React.memo(() => {
  return (
    <CenterView>
      <Text>Sync Data</Text>
    </CenterView>
  );
});

export const More = React.memo(() => {
  return (
    <CenterView>
      <Text>More</Text>
    </CenterView>
  );
});
