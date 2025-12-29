const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("🔧 API Client configured:", {
  apiUrl: API_URL,
  env: import.meta.env.MODE,
  hasViteApiUrl: !!import.meta.env.VITE_API_URL,
});

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    stats: {
      xp: number;
      level: string;
      streak: number;
      lastActiveDate?: string;
      achievements: string[];
      cardsLearned: number;
      testsPassed: number;
    };
  };
}

interface UserResponse {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  stats: {
    xp: number;
    level: string;
    streak: number;
    lastActiveDate?: string;
    achievements: string[];
    cardsLearned: number;
    testsPassed: number;
  };
}

interface MaterialResponse {
  _id: string;
  userId: string;
  title: string;
  originalContent: string;
  summary: string;
  glossary: { term: string; definition: string }[];
  keyFacts: string[];
  mindMap: any;
  flashcards: any[];
  createdAt: string;
  updatedAt: string;
}

interface QuizResultResponse {
  _id: string;
  userId: string;
  materialId: string;
  currentQuestionIndex?: number;
  answers?: { questionId: string; userAnswer: string }[];
  isCompleted: boolean;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
    });

    console.log(
      `📡 API Response: ${response.status} ${response.statusText} for ${endpoint}`
    );

    if (!response.ok) {
      let errorText = "";
      try {
        const error = await response.json();
        errorText = error.error || JSON.stringify(error);
      } catch {
        errorText = "Network error";
      }

      console.error(`❌ API Error: ${response.status} ${errorText}`);
      throw new Error(errorText || "Щось пішло не так");
    }

    return response.json();
  }

  // Auth
  async register(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    });
    this.token = data.token;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // User
  async getProfile(): Promise<UserResponse> {
    return this.request<UserResponse>("/auth/profile");
  }

  async getUser(): Promise<UserResponse> {
    return this.request<UserResponse>("/users/me");
  }

  async updateStats(stats: {
    xpDelta?: number;
    cardsLearned?: number;
    testsPassed?: number;
  }): Promise<UserResponse> {
    return this.request<UserResponse>("/users/stats", {
      method: "PATCH",
      body: JSON.stringify(stats),
    });
  }

  async addAchievement(achievement: string): Promise<UserResponse> {
    return this.request<UserResponse>("/users/achievements", {
      method: "POST",
      body: JSON.stringify({ achievement }),
    });
  }

  // Materials
  async getMaterials(): Promise<MaterialResponse[]> {
    return this.request<MaterialResponse[]>("/materials");
  }

  async getMaterial(id: string): Promise<MaterialResponse> {
    return this.request<MaterialResponse>(`/materials/${id}`);
  }

  async createMaterial(materialData: any): Promise<MaterialResponse> {
    // If `materialData.file` is a File object, send it as multipart/form-data
    if (materialData && materialData.file instanceof File) {
      const form = new FormData();
      // Append JSON fields
      for (const k of Object.keys(materialData)) {
        if (k === "file") continue;
        const v = (materialData as any)[k];
        form.append(k, typeof v === "string" ? v : JSON.stringify(v));
      }
      form.append("file", materialData.file);

      const headers: HeadersInit = {};
      if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
      const response = await fetch(`${API_URL}/materials`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Network error" }));
        throw new Error(error.error || "Щось пішло не так");
      }
      return response.json();
    }

    return this.request<MaterialResponse>("/materials", {
      method: "POST",
      body: JSON.stringify(materialData),
    });
  }

  async updateMaterial(id: string, data: any): Promise<MaterialResponse> {
    return this.request<MaterialResponse>(`/materials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateFlashcard(
    materialId: string,
    cardId: string,
    status: string,
    nextReview?: number
  ): Promise<MaterialResponse> {
    return this.request<MaterialResponse>(
      `/materials/${materialId}/flashcards/${cardId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, nextReview }),
      }
    );
  }

  async deleteMaterial(id: string): Promise<void> {
    return this.request<void>(`/materials/${id}`, {
      method: "DELETE",
    });
  }

  async downloadMaterialFile(id: string): Promise<Blob> {
    const headers: HeadersInit = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const res = await fetch(`${API_URL}/materials/${id}/file`, { headers });
    if (!res.ok) {
      throw new Error("Failed to download file");
    }
    return await res.blob();
  }

  // Chat
  async getChatHistory(materialId: string): Promise<any> {
    return this.request(`/chat/${materialId}`);
  }

  async addChatMessage(
    materialId: string,
    role: "user" | "model",
    text: string
  ): Promise<any> {
    return this.request(`/chat/${materialId}/messages`, {
      method: "POST",
      body: JSON.stringify({ role, text }),
    });
  }

  async clearChatHistory(materialId: string): Promise<void> {
    return this.request<void>(`/chat/${materialId}`, {
      method: "DELETE",
    });
  }

  // Quiz
  async saveQuizResult(resultData: any): Promise<QuizResultResponse> {
    return this.request<QuizResultResponse>("/quiz", {
      method: "POST",
      body: JSON.stringify(resultData),
    });
  }

  async saveQuizProgress(progressData: any): Promise<QuizResultResponse> {
    return this.request<QuizResultResponse>("/quiz/save-progress", {
      method: "POST",
      body: JSON.stringify(progressData),
    });
  }

  async resumeQuiz(quizId: string): Promise<QuizResultResponse> {
    return this.request<QuizResultResponse>(`/quiz/${quizId}/resume`);
  }

  async getQuizResults(materialId: string): Promise<QuizResultResponse[]> {
    return this.request<QuizResultResponse[]>(`/quiz/material/${materialId}`);
  }

  async getAllQuizResults(): Promise<QuizResultResponse[]> {
    return this.request<QuizResultResponse[]>("/quiz");
  }

  async getQuizStats(): Promise<any> {
    return this.request("/quiz/stats");
  }
}

export const api = new ApiClient();
