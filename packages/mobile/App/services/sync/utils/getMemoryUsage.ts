import { NativeModules } from 'react-native';

type MemoryUsage = {
  maxBytes: number;
  usedBytes: number;
};

export const getMemoryUsageRatio = async (): Promise<number | undefined> => {
  const module: any = NativeModules?.MemoryInfo;
  if (!module?.getMemoryUsage) return undefined;
  try {
    const { maxBytes, usedBytes } = (await module.getMemoryUsage()) as MemoryUsage;
    if (typeof maxBytes === 'number' && maxBytes > 0 && typeof usedBytes === 'number') {
      return usedBytes / maxBytes;
    }
  } catch (e) {
    console.warn('Error getting memory usage:', e);
    return undefined;
  }
  return undefined;
};

export const canIncreasePageSize = async (threshold: number = 0.6): Promise<boolean> => {
  const ratio = await getMemoryUsageRatio();
  if (ratio == null) return true; // if unknown, don't block increases
  return ratio < threshold;
};
