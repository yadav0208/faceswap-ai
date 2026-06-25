import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's IP when testing on a device
const BASE_URL = 'http://10.159.49.23:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 60000,
    });

    // Attach auth token from storage
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  async register(username: string, email: string, password: string, fullName?: string) {
    const res = await this.client.post('/api/auth/register', {
      username,
      email,
      password,
      full_name: fullName,
    });
    await AsyncStorage.setItem('auth_token', res.data.access_token);
    return res.data;
  }

  async login(username: string, password: string) {
    const res = await this.client.post('/api/auth/login', { username, password });
    await AsyncStorage.setItem('auth_token', res.data.access_token);
    return res.data;
  }

  async logout() {
    await AsyncStorage.removeItem('auth_token');
  }

  async getMe() {
    const res = await this.client.get('/api/auth/me');
    return res.data;
  }

  // ─── Poses ────────────────────────────────────────────────────────────────

  async getPoses(category?: string) {
    const params = category ? { category } : {};
    const res = await this.client.get('/api/poses', { params });
    return res.data as PoseTemplate[];
  }

  async getCategories() {
    const res = await this.client.get('/api/poses/categories');
    return res.data.categories as string[];
  }

  getPoseImageUrl(poseId: number) {
    return `${BASE_URL}/api/poses/${poseId}/image`;
  }

  getPoseThumbnailUrl(poseId: number) {
    return `${BASE_URL}/api/poses/${poseId}/thumbnail`;
  }

  // ─── Generate ─────────────────────────────────────────────────────────────

  async generateLook(
    imageUri: string,
    poseTemplateId: number,
    gender: string = 'auto',
    stylePrompt?: string,
  ) {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);
    formData.append('pose_template_id', String(poseTemplateId));
    formData.append('gender', gender);
    if (stylePrompt) formData.append('style_prompt', stylePrompt);

    const res = await this.client.post('/api/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as Generation;
  }

  async getGenerationStatus(id: number) {
    const res = await this.client.get(`/api/generate/${id}/status`);
    return res.data as GenerationStatus;
  }

  getResultImageUrl(generationId: number) {
    return `${BASE_URL}/api/generate/${generationId}/result`;
  }

  async getHistory() {
    const res = await this.client.get('/api/generate/history');
    return res.data as Generation[];
  }

  // ─── Polling ──────────────────────────────────────────────────────────────

  async pollGeneration(
    id: number,
    onProgress?: (status: GenerationStatus) => void,
    intervalMs = 1500,
    timeoutMs = 120000,
  ): Promise<GenerationStatus> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getGenerationStatus(id);
          onProgress?.(status);

          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Generation failed'));
          } else if (Date.now() - start > timeoutMs) {
            reject(new Error('Generation timed out'));
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (e) {
          reject(e);
        }
      };
      poll();
    });
  }
}

export const api = new ApiService();
export const API_BASE = 'http://localhost:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PoseTemplate {
  id: number;
  name: string;
  category: string;
  description?: string;
  template_image_url: string;
  thumbnail_url?: string;
  is_premium: boolean;
  sort_order: number;
}

export interface Generation {
  id: number;
  pose_template_id: number;
  source_image_url: string;
  result_image_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  style_prompt?: string;
  gender?: string;
  confidence_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface GenerationStatus {
  id: number;
  status: string;
  result_image_url?: string;
  error_message?: string;
  progress?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}
