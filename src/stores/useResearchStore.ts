import { create } from 'zustand';
import type { ResearchProject, Reference, LiteratureReview } from '@/types';

interface ResearchState {
  // 当前研究项目
  currentProject: ResearchProject | null;
  projects: ResearchProject[];

  // 文献综述
  literatureReview: LiteratureReview | null;

  // 操作状态
  isGeneratingIdeas: boolean;
  isGeneratingDesign: boolean;

  // Actions
  setCurrentProject: (project: ResearchProject) => void;
  createProject: (title: string, description: string, keywords: string[]) => void;
  addReference: (reference: Reference) => void;
  removeReference: (id: string) => void;
  setLiteratureReview: (review: LiteratureReview) => void;
  setGeneratingIdeas: (loading: boolean) => void;
  setGeneratingDesign: (loading: boolean) => void;
  updateProjectStatus: (status: ResearchProject['status']) => void;
}

let projectIdCounter = 0;

export const useResearchStore = create<ResearchState>((set, get) => ({
  currentProject: null,
  projects: [],
  literatureReview: null,
  isGeneratingIdeas: false,
  isGeneratingDesign: false,

  setCurrentProject: (project) => set({ currentProject: project }),

  createProject: (title, description, keywords) => {
    projectIdCounter++;
    const project: ResearchProject = {
      id: `proj-${projectIdCounter}`,
      title,
      description,
      keywords,
      discipline: '数字人文',
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
      references: [],
      literatureReview: '',
      researchIdeas: [],
      experiments: [],
    };
    set(state => ({
      projects: [...state.projects, project],
      currentProject: project,
    }));
  },

  addReference: (reference) => {
    const current = get().currentProject;
    if (!current) return;
    const updated = {
      ...current,
      references: [...current.references.filter(r => r.id !== reference.id), reference],
      updatedAt: new Date(),
    };
    set({ currentProject: updated });
  },

  removeReference: (id) => {
    const current = get().currentProject;
    if (!current) return;
    const updated = {
      ...current,
      references: current.references.filter(r => r.id !== id),
      updatedAt: new Date(),
    };
    set({ currentProject: updated });
  },

  setLiteratureReview: (review) => set({ literatureReview: review }),

  setGeneratingIdeas: (loading) => set({ isGeneratingIdeas: loading }),
  setGeneratingDesign: (loading) => set({ isGeneratingDesign: loading }),

  updateProjectStatus: (status) => {
    const current = get().currentProject;
    if (!current) return;
    set({ currentProject: { ...current, status, updatedAt: new Date() } });
  },
}));
