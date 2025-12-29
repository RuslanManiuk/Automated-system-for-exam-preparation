import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/apiClient";

export const AuthCallback: React.FC = () => {
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Отримати токен з URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        try {
          // Зберегти токен
          api.setAuthToken(token);
          localStorage.setItem("token", token);

          // Отримати дані користувача
          const userData = await api.getProfile();

          // Перенаправити на головну сторінку
          window.location.href = "/";
        } catch (error) {
          console.error("OAuth callback error:", error);
          window.location.href = "/?error=auth_failed";
        }
      } else {
        window.location.href = "/?error=no_token";
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Авторизація...</p>
      </div>
    </div>
  );
};
