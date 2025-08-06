import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { FetchOptions } from '..';

const MAX_FETCH_WAIT_TIME = 45 * 1000; // 45 seconds in milliseconds

export const axiosWithTimeout = async (
  url: string,
  config?: FetchOptions,
): Promise<AxiosResponse> => {
  const { timeout, ...otherConfig } = config || {};
  
  const axiosConfig: AxiosRequestConfig = {
    ...otherConfig,
    timeout: timeout || MAX_FETCH_WAIT_TIME,
  };

  return axios(url, axiosConfig);
}; 