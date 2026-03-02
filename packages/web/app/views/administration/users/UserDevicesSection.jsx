import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../../constants';
import { TranslatedText, BodyText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useUserDevicesQuery } from '../../../api/queries';
import { useDeleteUserDeviceMutation } from '../../../api/mutations';
import { formatShortest } from '@tamanu/utils/dateTime';

const SectionContainer = styled(Box)`
  padding: 16px 0;
`;

const SectionTitle = styled(Box)`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${Colors.darkestText};
  margin-bottom: 10px;
`;

const SectionSubtitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
  margin-bottom: 16px;
`;

const DeviceList = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DeviceItem = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
`;

const DeviceInfo = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DeviceId = styled(BodyText)`
  font-weight: 500;
  color: ${Colors.darkestText};
  font-family: monospace;
  font-size: 12px;
`;

const DeviceLastSeen = styled(BodyText)`
  font-size: 12px;
  color: ${Colors.midText};
`;

const NoDevicesMessage = styled(BodyText)`
  color: ${Colors.midText};
  font-style: italic;
`;

const DeleteButton = styled(IconButton)`
  color: ${Colors.alert};
  padding: 8px;
  &:hover {
    background-color: ${Colors.alert}10;
  }
`;

export const UserDevicesSection = ({ user, canUpdateUser }) => {
  const queryClient = useQueryClient();
  const { data: devicesData, isLoading } = useUserDevicesQuery(user?.id);
  const { mutate: deleteDevice, isPending: isDeleting } = useDeleteUserDeviceMutation(user?.id);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  const devices = devicesData?.data || [];

  const handleDeleteClick = device => {
    setDeviceToDelete(device);
  };

  const handleConfirmDelete = () => {
    if (!deviceToDelete) return;

    deleteDevice(deviceToDelete.id, {
      onSuccess: () => {
        toast.success('Device unregistered successfully');
        queryClient.invalidateQueries(['userDevices', user?.id]);
        setDeviceToDelete(null);
      },
      onError: error => {
        toast.error(error.message || 'Failed to unregister device');
        setDeviceToDelete(null);
      },
    });
  };

  const handleCancelDelete = () => {
    setDeviceToDelete(null);
  };

  if (isLoading) {
    return (
      <SectionContainer>
        <SectionTitle>
          <TranslatedText stringId="admin.users.devices.title" fallback="Registered devices" />
        </SectionTitle>
        <BodyText>Loading...</BodyText>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <SectionTitle>
        <TranslatedText stringId="admin.users.devices.title" fallback="Registered devices" />
      </SectionTitle>
      <SectionSubtitle>
        <TranslatedText
          stringId="admin.users.devices.subtitle"
          fallback="Devices registered by this user for syncing data."
        />
      </SectionSubtitle>

      {devices.length === 0 ? (
        <NoDevicesMessage>
          <TranslatedText
            stringId="admin.users.devices.noDevices"
            fallback="No devices registered."
          />
        </NoDevicesMessage>
      ) : (
        <DeviceList>
          {devices.map(device => (
            <DeviceItem key={device.id}>
              <DeviceInfo>
                <DeviceId>{device.name || device.id}</DeviceId>
                <DeviceLastSeen>
                  <TranslatedText
                    stringId="admin.users.devices.lastSeen"
                    fallback="Last seen: :date"
                    replacements={{ date: formatShortest(device.lastSeenAt) }}
                  />
                </DeviceLastSeen>
              </DeviceInfo>
              {canUpdateUser && (
                <DeleteButton
                  onClick={() => handleDeleteClick(device)}
                  disabled={isDeleting}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </DeleteButton>
              )}
            </DeviceItem>
          ))}
        </DeviceList>
      )}

      <ConfirmModal
        title={
          <TranslatedText
            stringId="admin.users.devices.deleteConfirm.title"
            fallback="Unregister device"
          />
        }
        text={
          <TranslatedText
            stringId="admin.users.devices.deleteConfirm.text"
            fallback="Are you sure you want to unregister this device? The user will need to re-register it to sync data again."
          />
        }
        open={!!deviceToDelete && !isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </SectionContainer>
  );
};
