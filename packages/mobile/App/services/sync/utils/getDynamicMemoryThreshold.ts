import { NativeModules } from 'react-native';

export const getDynamicMemoryThreshold = (): number => {
    let threshold = 0.6;
  
    const { MemoryInfo } = NativeModules as any;
    const memoryClass: number | undefined = MemoryInfo?.memoryClass;
    const isLowRam: boolean | undefined = MemoryInfo?.isLowRamDevice;
    console.log('memoryClass: ', memoryClass, 'isLowRam: ', isLowRam);
    if (isLowRam) return 0.55;
  
    if (typeof memoryClass === 'number') {
      if (memoryClass <= 128) threshold = 0.58;
      else if (memoryClass <= 192) threshold = 0.62;
      else if (memoryClass <= 256) threshold = 0.68;
      else threshold = 0.72;
    }
  
    return threshold;
  };
  