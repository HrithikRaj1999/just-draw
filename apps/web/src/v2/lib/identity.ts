import type { UserIdentity } from "../types/whiteboard";

const USER_STORAGE_KEY = "whiteboard.v2.user";
const USER_COLORS = [
  "#2563EB",
  "#DC2626",
  "#059669",
  "#D97706",
  "#7C3AED",
  "#0891B2",
];

const randomSegment = (): string =>
  Math.floor(100 + Math.random() * 900).toString() +
  "-" +
  Math.floor(100 + Math.random() * 900).toString();

const randomName = (): string =>
  `Engineer ${Math.floor(10 + Math.random() * 90)}`;

const randomColor = (): string =>
  USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

export const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const getOrCreateUser = (): UserIdentity => {
  if (typeof window === "undefined") {
    return {
      id: createId(),
      name: randomName(),
      color: randomColor(),
    };
  }

  const fromStorage = window.localStorage.getItem(USER_STORAGE_KEY);
  if (fromStorage) {
    try {
      const parsed = JSON.parse(fromStorage) as UserIdentity;
      if (parsed?.id && parsed?.name && parsed?.color) {
        return parsed;
      }
    } catch {
      // Ignore malformed local state and regenerate identity.
    }
  }

  const created: UserIdentity = {
    id: createId(),
    name: randomName(),
    color: randomColor(),
  };
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(created));
  return created;
};

export const updateUserName = (name: string): void => {
  if (typeof window === "undefined") return;
  const user = getOrCreateUser();
  user.name = name;
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const getOrCreateRoomId = (): string => {
  if (typeof window === "undefined") {
    return "local-room";
  }

  const url = new URL(window.location.href);
  const roomParam = url.searchParams.get("room");
  if (roomParam && roomParam.trim().length > 0) {
    return roomParam;
  }

  const generated = randomSegment();
  url.searchParams.set("room", generated);
  window.history.replaceState({}, "", url.toString());
  return generated;
};
