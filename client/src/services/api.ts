import type { User, Survey, SurveyResponse, Analytics, AuthResponse } from '../types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    // Handle file downloads (CSV)
    if (response.headers.get('Content-Type')?.includes('text/csv')) {
      return response.blob() as unknown as T;
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
  }

  // Surveys
  async getSurveys(): Promise<{ surveys: Survey[] }> {
    return this.request<{ surveys: Survey[] }>('/surveys');
  }

  async getSurvey(id: number): Promise<{ survey: Survey }> {
    return this.request<{ survey: Survey }>(`/surveys/${id}`);
  }

  async getMySurveys(): Promise<{ surveys: Survey[] }> {
    return this.request<{ surveys: Survey[] }>('/surveys/user/my-surveys');
  }

  async createSurvey(survey: Partial<Survey>): Promise<{ survey: Survey; message: string }> {
    return this.request<{ survey: Survey; message: string }>('/surveys', {
      method: 'POST',
      body: JSON.stringify(survey),
    });
  }

  async updateSurvey(id: number, survey: Partial<Survey>): Promise<{ survey: Survey; message: string }> {
    return this.request<{ survey: Survey; message: string }>(`/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(survey),
    });
  }

  async deleteSurvey(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/surveys/${id}`, {
      method: 'DELETE',
    });
  }

  async publishSurvey(id: number, isPublished: boolean): Promise<{ message: string; is_published: boolean }> {
    return this.request<{ message: string; is_published: boolean }>(`/surveys/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ is_published: isPublished }),
    });
  }

  async getQRCode(id: number): Promise<{ qrCode: string; surveyUrl: string }> {
    return this.request<{ qrCode: string; surveyUrl: string }>(`/surveys/${id}/qrcode`);
  }

  getQRCodeDownloadUrl(id: number): string {
    const token = this.getToken();
    return `${API_BASE}/surveys/${id}/qrcode/download${token ? `?token=${token}` : ''}`;
  }

  // Responses
  async submitResponse(surveyId: number, answers: Record<string, string | string[]>): Promise<{ message: string; responseId: number }> {
    return this.request<{ message: string; responseId: number }>(`/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getResponses(surveyId: number): Promise<{ responses: SurveyResponse[] }> {
    return this.request<{ responses: SurveyResponse[] }>(`/surveys/${surveyId}/responses`);
  }

  async getAnalytics(surveyId: number): Promise<Analytics> {
    return this.request<Analytics>(`/surveys/${surveyId}/analytics`);
  }

  getExportUrl(surveyId: number): string {
    const token = this.getToken();
    return `${API_BASE}/surveys/${surveyId}/export${token ? `?token=${token}` : ''}`;
  }

  // Admin
  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/admin/users');
  }

  async toggleUserActive(id: number): Promise<{ message: string; is_active: boolean }> {
    return this.request<{ message: string; is_active: boolean }>(`/admin/users/${id}/toggle-active`, {
      method: 'PUT',
    });
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllSurveys(): Promise<{ surveys: Survey[] }> {
    return this.request<{ surveys: Survey[] }>('/admin/surveys');
  }

  async deleteAnySurvey(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/admin/surveys/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(): Promise<{
    stats: {
      totalUsers: number;
      totalSurveys: number;
      publishedSurveys: number;
      totalResponses: number;
    };
    responsesOverTime: { date: string; count: number }[];
    topSurveys: { id: number; title: string; response_count: number }[];
    userRoles: { role: string; count: number }[];
  }> {
    return this.request('/admin/stats');
  }
}

export const api = new ApiService();
export default api;
