import { Platform } from 'react-native';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const hostIP = debuggerHost?.split(':')[0];

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = hostIP 
    ? `http://${hostIP}:8080/api` 
    : `http://${LOCALHOST}:8080/api`;

console.log('API_BASE_URL:', API_BASE_URL);
