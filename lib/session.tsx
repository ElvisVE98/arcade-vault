"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type User = { name: string };

export type SavedScore = {
  game: string;
  score: number;
  name: string;
  at: number;
};

type SessionContextValue = {
  user: User | null;
  login: (user: User) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Empieza en null (igual que el servidor) y lee localStorage tras montar
  // para evitar errores de hidratación.
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as User).name === "string"
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única tras montar
        setUser({ name: (parsed as User).name });
      }
    } catch {
      // localStorage no disponible o JSON inválido: se ignora.
    }
  }, []);

  const login = useCallback((u: User) => {
    setUser(u);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem(SCORES_KEY) || "[]",
      );
      const all: SavedScore[] = Array.isArray(parsed) ? parsed : [];
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut, saveScore }),
    [user, login, signOut, saveScore],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
