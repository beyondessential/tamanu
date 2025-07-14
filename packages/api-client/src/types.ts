interface Logger {
    debug: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  }
  
  export type LoggerType = Logger | Console;


export interface FetchOptions extends RequestInit {
    fetch?: typeof fetch;
    timeout?: number | false;
  }

  export interface ResponseError {
    name: string;
    message: string;
  }
  
  export interface ResponseErrorData {
    error?: ResponseError;
    [key: string]: any;
  }