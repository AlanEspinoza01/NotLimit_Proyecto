import api from '../api/axios';
import { ClippyAdminConfig, ClippyPublicConfig, ClippyReply } from './clippy.types';

// Siempre utiliza el mismo /api que el resto del proyecto; Gemini nunca se llama aquí.
export const getClippyPublicConfig = async (): Promise<ClippyPublicConfig> => {
  const { data } = await api.get('/clippy/config');
  return data.data as ClippyPublicConfig;
};

export const sendClippyQuestion = async (payload: { question?: string; questionId?: string; allowGemini?: boolean; history?: Array<{ role: 'user' | 'assistant'; text: string }> }): Promise<ClippyReply> => {
  const { data } = await api.post('/clippy/ask', payload);
  return data.data as ClippyReply;
};

// El backend verifica cookie + rol super_admin para las tres rutas.
export const getClippyAdminConfig = async (): Promise<ClippyAdminConfig> => {
  const { data } = await api.get('/admin/clippy/settings');
  return data.data as ClippyAdminConfig;
};

export const saveClippyAdminConfig = async (config: ClippyAdminConfig): Promise<ClippyAdminConfig> => {
  const { data } = await api.put('/admin/clippy/settings', config);
  return data.data as ClippyAdminConfig;
};

export const getClippyUsage = async (): Promise<number> => {
  const { data } = await api.get('/admin/clippy/usage');
  return Number(data.data?.todayAiRequests || 0);
};
