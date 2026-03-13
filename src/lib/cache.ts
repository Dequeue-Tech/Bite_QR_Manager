import Redis from 'ioredis';

type Cache = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
};

class InMemoryCache implements Cache {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

class RedisCache implements Cache {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, { maxRetriesPerRequest: 1 });
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }
}

const redisUrl = process.env.REDIS_URL;
export const cache: Cache = redisUrl ? new RedisCache(redisUrl) : new InMemoryCache();
