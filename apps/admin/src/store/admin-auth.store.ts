import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import type { AdminUser } from "@/types/admin.types";
import { authApi } from "@/lib/api/admin.api";

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  language: "en" | "ar";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAdmin: (admin: AdminUser) => void;
  clearError: () => void;
  setLanguage: (lang: "en" | "ar") => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isLoading: false,
      error: null,
      language: "en",

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login({ email, password });
          Cookies.set("admin_token", data.token, {
            expires: 7,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
          set({ admin: data.admin, token: data.token, isLoading: false });
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Login failed. Please check your credentials.";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // swallow — still clear local state
        } finally {
          Cookies.remove("admin_token");
          set({ admin: null, token: null });
        }
      },

      setAdmin: (admin) => set({ admin }),
      clearError: () => set({ error: null }),
      setLanguage: (language) => {
        set({ language });
        if (typeof document !== "undefined") {
          document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = language;
        }
      },
    }),
    {
      name: "admin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        language: state.language,
      }),
    }
  )
);

export const selectIsAuthenticated = (s: AdminAuthState) =>
  !!s.admin && !!s.token;
export const selectAdmin = (s: AdminAuthState) => s.admin;
export const selectLanguage = (s: AdminAuthState) => s.language;
