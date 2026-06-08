import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch (e) {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try { localStorage.removeItem(key); } catch (e) {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

const PIN_KEY = 'user_pin';
const SEC_QUESTION_KEY = 'security_question';
const SEC_ANSWER_KEY = 'security_answer';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const authService = {
  // PIN Management
  async setPin(pin: string): Promise<void> {
    await setItemAsync(PIN_KEY, pin);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const storedPin = await getItemAsync(PIN_KEY);
    return storedPin === pin;
  },

  async hasPinSetup(): Promise<boolean> {
    const storedPin = await getItemAsync(PIN_KEY);
    return storedPin !== null;
  },

  async getPin(): Promise<string | null> {
    return await getItemAsync(PIN_KEY);
  },

  // Security Question Management
  async setSecurityQuestion(questionId: string, answer: string): Promise<void> {
    await setItemAsync(SEC_QUESTION_KEY, questionId);
    await setItemAsync(SEC_ANSWER_KEY, answer.trim().toLowerCase());
  },

  async getSecurityQuestion(): Promise<string | null> {
    return await getItemAsync(SEC_QUESTION_KEY);
  },

  async verifySecurityAnswer(answer: string): Promise<boolean> {
    const storedAnswer = await getItemAsync(SEC_ANSWER_KEY);
    return storedAnswer === answer.trim().toLowerCase();
  },

  // Biometric Management
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticateBiometric(promptMessage: string = 'Authenticate to access your expenses'): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const isAvailable = await this.isBiometricAvailable();
    if (!isAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });

    return result.success;
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  },

  // Full reset (for factory reset or testing)
  async clearAllAuth(): Promise<void> {
    await deleteItemAsync(PIN_KEY);
    await deleteItemAsync(SEC_QUESTION_KEY);
    await deleteItemAsync(SEC_ANSWER_KEY);
    await deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }
};
