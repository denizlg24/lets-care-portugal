/**
 * Anonymous commenter identity, persisted in localStorage so a visitor keeps
 * the same name + session token across visits. This is a placeholder until
 * real sign-in (e.g. Google) is wired up; the sessionId also lets the backend
 * show authors their own pending comments.
 */

const SESSION_KEY = "lc_blog_session";
const NAME_KEY = "lc_blog_name";

const ADJECTIVES = [
  "Curioso",
  "Atento",
  "Amável",
  "Sereno",
  "Solidário",
  "Pensativo",
  "Otimista",
  "Gentil",
  "Sábio",
  "Tranquilo",
  "Corajoso",
  "Simpático",
] as const;

const NOUNS = [
  "Visitante",
  "Leitor",
  "Andorinha",
  "Cuidador",
  "Peregrino",
  "Companheiro",
  "Explorador",
  "Vizinho",
  "Colibri",
  "Caminhante",
] as const;

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomName(): string {
  return `${pick(NOUNS)} ${pick(ADJECTIVES)}`;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export interface AnonIdentity {
  sessionId: string;
  name: string;
}

/** Reads (or lazily creates) the persisted anonymous identity. */
export function getAnonIdentity(): AnonIdentity {
  if (typeof window === "undefined") {
    return { sessionId: "", name: "" };
  }

  let sessionId = window.localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = randomToken();
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }

  let name = window.localStorage.getItem(NAME_KEY);
  if (!name) {
    name = randomName();
    window.localStorage.setItem(NAME_KEY, name);
  }

  return { sessionId, name };
}

/** Persists a new display name chosen by the visitor. */
export function setAnonName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name.trim() || randomName());
}
