import { create } from 'zustand';
import { authService } from '../services/auth';
import { initDB } from '../db';

interface AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  hasPinSetup: boolean;
  biometricEnabled: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  login: (pin?: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => void;
  setupPin: (pin: string, questionId: string, answer: string, enableBiometric: boolean) => Promise<void>;
  resetPin: (newPin: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isReady: false,
  isAuthenticated: false,
  hasPinSetup: false,
  biometricEnabled: false,

  initialize: async () => {
    try {
      await initDB();
      const hasPin = await authService.hasPinSetup();
      const bioEnabled = await authService.isBiometricEnabled();
      set({ 
        hasPinSetup: hasPin, 
        biometricEnabled: bioEnabled,
        isReady: true 
      });
    } catch (e) {
      console.error('Error initializing auth store:', e);
      set({ isReady: true });
    }
  },

  login: async (pin?: string) => {
    if (pin) {
      const isValid = await authService.verifyPin(pin);
      if (isValid) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    }
    return false;
  },

  loginWithBiometrics: async () => {
    const success = await authService.authenticateBiometric();
    if (success) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  setupPin: async (pin: string, questionId: string, answer: string, enableBiometric: boolean) => {
    await authService.setPin(pin);
    await authService.setSecurityQuestion(questionId, answer);
    await authService.setBiometricEnabled(enableBiometric);
    
    set({
      hasPinSetup: true,
      biometricEnabled: enableBiometric,
      isAuthenticated: true // Log them in immediately after setup
    });
  },

  resetPin: async (newPin: string) => {
    await authService.setPin(newPin);
    set({ isAuthenticated: true });
  }
}));
