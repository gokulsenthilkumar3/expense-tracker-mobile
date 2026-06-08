import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'user_pin';
const SEC_QUESTION_KEY = 'security_question';
const SEC_ANSWER_KEY = 'security_answer';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const authService = {
  // PIN Management
  async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  },

  async hasPinSetup(): Promise<boolean> {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin !== null;
  },

  async getPin(): Promise<string | null> {
    return await SecureStore.getItemAsync(PIN_KEY);
  },

  // Security Question Management
  async setSecurityQuestion(questionId: string, answer: string): Promise<void> {
    await SecureStore.setItemAsync(SEC_QUESTION_KEY, questionId);
    await SecureStore.setItemAsync(SEC_ANSWER_KEY, answer.trim().toLowerCase());
  },

  async getSecurityQuestion(): Promise<string | null> {
    return await SecureStore.getItemAsync(SEC_QUESTION_KEY);
  },

  async verifySecurityAnswer(answer: string): Promise<boolean> {
    const storedAnswer = await SecureStore.getItemAsync(SEC_ANSWER_KEY);
    return storedAnswer === answer.trim().toLowerCase();
  },

  // Biometric Management
  async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticateBiometric(promptMessage: string = 'Authenticate to access your expenses'): Promise<boolean> {
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
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  },

  // Full reset (for factory reset or testing)
  async clearAllAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(SEC_QUESTION_KEY);
    await SecureStore.deleteItemAsync(SEC_ANSWER_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }
};
