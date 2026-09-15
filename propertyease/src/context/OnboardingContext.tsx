'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
  propertyType: string;
  portfolioSize: string;
  mainChallenge: string;
  teamSize: string;
  companyName: string;
  companyLocation: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  step: number;
  setData: (partial: Partial<OnboardingData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const Context = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<OnboardingData>({
    propertyType: '',
    portfolioSize: '',
    mainChallenge: '',
    teamSize: '',
    companyName: '',
    companyLocation: '',
  });
  const [step, setStepState] = useState(0);

  const setData = (partial: Partial<OnboardingData>) => {
    setDataState(prev => ({ ...prev, ...partial }));
  };

  const setStep = (s: number) => setStepState(Math.max(0, Math.min(s, 5)));
  const nextStep = () => setStepState(s => Math.min(s + 1, 5));
  const prevStep = () => setStepState(s => Math.max(s - 1, 0));
  const reset = () => {
    setDataState({ propertyType: '', portfolioSize: '', mainChallenge: '', teamSize: '', companyName: '', companyLocation: '' });
    setStepState(0);
  };

  return (
    <Context.Provider value={{ data, step, setData, setStep, nextStep, prevStep, reset }}>
      {children}
    </Context.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
