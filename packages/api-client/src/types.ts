interface Logger {
    debug: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  }
  
  export type LoggerType = Logger | Console;
