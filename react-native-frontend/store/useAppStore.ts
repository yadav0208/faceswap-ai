import { create } from 'zustand';
import { User, PoseTemplate, Generation } from '../services/api';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // Selected photo
  selectedPhotoUri: string | null;
  setSelectedPhotoUri: (uri: string | null) => void;

  // Selected pose
  selectedPose: PoseTemplate | null;
  setSelectedPose: (pose: PoseTemplate | null) => void;

  // Current generation
  currentGeneration: Generation | null;
  setCurrentGeneration: (gen: Generation | null) => void;
  generationProgress: number;
  setGenerationProgress: (p: number) => void;

  // History
  history: Generation[];
  setHistory: (items: Generation[]) => void;
  addToHistory: (item: Generation) => void;

  // UI
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),

  // Photo
  selectedPhotoUri: null,
  setSelectedPhotoUri: (uri) => set({ selectedPhotoUri: uri }),

  // Pose
  selectedPose: null,
  setSelectedPose: (pose) => set({ selectedPose: pose }),

  // Generation
  currentGeneration: null,
  setCurrentGeneration: (gen) => set({ currentGeneration: gen }),
  generationProgress: 0,
  setGenerationProgress: (p) => set({ generationProgress: p }),

  // History
  history: [],
  setHistory: (items) => set({ history: items }),
  addToHistory: (item) =>
    set((state) => ({ history: [item, ...state.history] })),

  // UI
  activeCategory: 'all',
  setActiveCategory: (cat) => set({ activeCategory: cat }),
}));
