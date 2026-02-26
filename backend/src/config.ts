const asNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: asNumber(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  redisUrl: process.env.REDIS_URL ?? "",
  boardStorageDir: process.env.BOARD_STORAGE_DIR ?? "./data/boards",
  autosaveDebounceMs: asNumber(process.env.AUTOSAVE_DEBOUNCE_MS, 750),
};
