import { destr } from "destr";
import { Redis } from "ioredis";
import type { Logger } from "pino";

interface Cache {
  get<T>(k: string): Promise<T | null>;
  /**
   *
   * @param key String key for the cached item
   * @param value
   * @param expiry A date value in the future that this cached item will expire at.
   * @returns
   */
  set<T>(k: string, value: T, expiresAt?: Date): Promise<boolean>;
  delete(k: string): Promise<void>;
}

class RedisCache implements Cache {
  private cache: Redis;

  constructor(args: { url: string; logger: Logger }) {
    try {
      this.cache = new Redis(args.url, { tls: {}, connectTimeout: 30_000 });
    } catch (e) {
      args.logger.error(e);
      throw e;
    }
  }

  public async get<T>(key: string) {
    const data = await this.cache.get(key);

    if (!data) {
      return null;
    }

    const value = destr<T>(await this.cache.get(key));

    return value;
  }

  public async set<T>(key: string, value: T, expiry?: Date) {
    const ttl = expiry ? expiry.getTime() - Date.now() : undefined;

    if (ttl !== undefined) {
      const result = await this.cache.set(key, JSON.stringify(value), "PX", ttl);
      return result === "OK";
    }

    const result = await this.cache.set(key, JSON.stringify(value));

    return result === "OK";
  }

  public async delete(key: string) {
    await this.cache.del(key);
  }
}

// funny name
const cacheRegister = {
  redis: RedisCache,
} as const;

export const createCacheInstance = <T extends keyof typeof cacheRegister>(
  type: T,
  args: ConstructorParameters<(typeof cacheRegister)[T]>[0],
): Cache => {
  return new cacheRegister[type](args);
};
