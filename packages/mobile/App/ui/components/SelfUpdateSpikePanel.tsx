// SPIKE: throwaway test panel for silent self-update. Do not merge.
import React, { type ReactElement, useCallback, useState } from 'react';
import { Button, NativeModules, Text, TextInput, View } from 'react-native';
import { getVersion } from 'react-native-device-info';
import RNFS from 'react-native-fs';

interface SelfUpdateModule {
  canRequestPackageInstalls(): Promise<boolean>;
  openInstallPermissionSettings(): void;
  getLastStatus(): Promise<string | null>;
  installApk(apkPath: string): Promise<void>;
}

const SelfUpdate: SelfUpdateModule = NativeModules.SelfUpdate;

// 10.0.2.2 is the host machine from the Android emulator
const DEFAULT_APK_URL = 'http://10.0.2.2:8000/app-release.apk';

export const SelfUpdateSpikePanel = (): ReactElement => {
  const [apkUrl, setApkUrl] = useState(DEFAULT_APK_URL);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((line: string) => setLog(previous => [...previous, line]), []);

  const checkPermission = useCallback(async () => {
    const canInstall = await SelfUpdate.canRequestPackageInstalls();
    addLog(`Install permission granted: ${canInstall}`);
  }, [addLog]);

  const showLastStatus = useCallback(async () => {
    addLog(`Last install status: ${await SelfUpdate.getLastStatus()}`);
  }, [addLog]);

  const downloadAndInstall = useCallback(async () => {
    const apkPath = `${RNFS.CachesDirectoryPath}/update.apk`;
    try {
      addLog(`Downloading ${apkUrl}`);
      const { promise } = RNFS.downloadFile({ fromUrl: apkUrl, toFile: apkPath });
      const { statusCode, bytesWritten } = await promise;
      addLog(`Downloaded: HTTP ${statusCode}, ${bytesWritten} bytes`);
      await SelfUpdate.installApk(apkPath);
      addLog('Install session committed; watch for a prompt or a restart');
    } catch (error) {
      addLog(`Error: ${(error as Error).message}`);
    }
  }, [apkUrl, addLog]);

  return (
    <View style={{ backgroundColor: 'white', padding: 8, margin: 8, borderRadius: 4 }}>
      <Text style={{ fontWeight: 'bold' }}>Self-update spike · running v{getVersion()}</Text>
      <TextInput
        value={apkUrl}
        onChangeText={setApkUrl}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ccc', marginVertical: 4, padding: 4 }}
      />
      <Button title="Check permission" onPress={checkPermission} />
      <Button title="Open permission settings" onPress={SelfUpdate.openInstallPermissionSettings} />
      <Button title="Download and install" onPress={downloadAndInstall} />
      <Button title="Show last install status" onPress={showLastStatus} />
      {log.map((line, index) => (
        <Text key={index} style={{ fontSize: 11 }}>
          {line}
        </Text>
      ))}
    </View>
  );
};
