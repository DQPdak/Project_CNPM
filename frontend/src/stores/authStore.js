import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from "../services/auth/authService";

const defaultState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  initialized: false,
  isAuthenticated: false,
  isRefreshing: false,
  sessionStatus: "unauthenticated",
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...defaultState,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: Boolean(accessToken && user),
          sessionStatus: accessToken && user ? "authenticated" : "unauthenticated",
        }),
      clearSession: () =>
        set({
          ...defaultState,
          initialized: true,
        }),
      initializeAuth: async () => {
        const { accessToken, refreshToken } = get();

        if (!accessToken || !refreshToken) {
          set({ initialized: true, sessionStatus: "unauthenticated" });
          return;
        }

        try {
          const me = await meRequest(accessToken);
          set({
            user: me.user,
            isAuthenticated: true,
            initialized: true,
            sessionStatus: "authenticated",
          });
        } catch (error) {
          if (error.status !== 401) {
            set({ initialized: true, sessionStatus: "unauthenticated" });
            return;
          }

          try {
            await get().refreshSession();
            const currentAccessToken = get().accessToken;
            const me = await meRequest(currentAccessToken);
            set({
              user: me.user,
              isAuthenticated: true,
              initialized: true,
              sessionStatus: "authenticated",
            });
          } catch (refreshError) {
            get().clearSession();
          }
        }
      },
      login: async ({ email, password }) => {
        set({ sessionStatus: "authenticating" });
        const result = await loginRequest({ email, password });
        set({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
          isAuthenticated: true,
          initialized: true,
          sessionStatus: "authenticated",
        });
        return result;
      },
      refreshSession: async () => {
        const { refreshToken, isRefreshing } = get();

        if (!refreshToken) {
          throw new Error("Missing refresh token.");
        }

        if (isRefreshing) {
          return;
        }

        set({ isRefreshing: true, sessionStatus: "refreshing" });

        try {
          const result = await refreshRequest(refreshToken);
          set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isAuthenticated: true,
            sessionStatus: "authenticated",
          });
          return result;
        } finally {
          set({ isRefreshing: false });
        }
      },
      logout: async () => {
        const { refreshToken } = get();

        set({ sessionStatus: "logging_out" });
        try {
          if (refreshToken) {
            await logoutRequest(refreshToken);
          }
        } finally {
          get().clearSession();
        }
      },
    }),
    {
      name: "manga-auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
