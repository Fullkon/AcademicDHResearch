import { create } from 'zustand';
import type { Experiment, ExperimentResult, Finding } from '@/types';

interface ExperimentState {
  experiments: Experiment[];
  currentExperiment: Experiment | null;
  results: ExperimentResult | null;
  findings: Finding[];
  isExecuting: boolean;
  executionProgress: number;
  executionStep: string;

  setExperiments: (experiments: Experiment[]) => void;
  addExperiment: (experiment: Experiment) => void;
  setCurrentExperiment: (experiment: Experiment | null) => void;
  setResults: (results: ExperimentResult) => void;
  setFindings: (findings: Finding[]) => void;
  setExecuting: (executing: boolean) => void;
  setExecutionProgress: (progress: number, step: string) => void;
  updateExperimentStatus: (id: string, status: Experiment['status']) => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  experiments: [],
  currentExperiment: null,
  results: null,
  findings: [],
  isExecuting: false,
  executionProgress: 0,
  executionStep: '',

  setExperiments: (experiments) => set({ experiments }),

  addExperiment: (experiment) =>
    set(state => ({
      experiments: [...state.experiments, experiment],
      currentExperiment: experiment,
    })),

  setCurrentExperiment: (experiment) => set({ currentExperiment: experiment }),

  setResults: (results) => set({ results }),

  setFindings: (findings) => set({ findings }),

  setExecuting: (executing) => set({ isExecuting: executing }),

  setExecutionProgress: (progress, step) =>
    set({ executionProgress: progress, executionStep: step }),

  updateExperimentStatus: (id, status) =>
    set(state => ({
      experiments: state.experiments.map(e =>
        e.id === id ? { ...e, status, completedAt: status === 'completed' ? new Date() : e.completedAt } : e
      ),
      currentExperiment: state.currentExperiment?.id === id
        ? { ...state.currentExperiment, status, completedAt: status === 'completed' ? new Date() : state.currentExperiment.completedAt }
        : state.currentExperiment,
    })),
}));
