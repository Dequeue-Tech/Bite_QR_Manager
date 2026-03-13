"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class InMemoryCache {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds) {
        this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
}
class RedisCache {
    constructor(url) {
        this.client = new ioredis_1.default(url, { maxRetriesPerRequest: 1 });
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
    }
}
const redisUrl = process.env.REDIS_URL;
exports.cache = redisUrl ? new RedisCache(redisUrl) : new InMemoryCache();
