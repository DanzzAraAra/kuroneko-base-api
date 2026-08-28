/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import { Request, Response, NextFunction } from "express";
import { Redis } from "@upstash/redis";
import { logRateLimit } from "../logger";

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
const WINDOW_TIME = Number(process.env.RATE_LIMIT_WINDOW);
const BAN_TIME = Number(process.env.RATE_LIMIT_BAN_TIME);

if (!MAX_REQUESTS || !WINDOW_TIME || !BAN_TIME) {
  throw new Error("Rate limit configuration is missing in .env");
}

type IpData = {
  requests: number[];
  bannedUntil: number;
};

const ipData = new Map<string, IpData>();

const hasRedis =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis ? Redis.fromEnv() : null;

const getIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  let ip: string;

  if (typeof forwarded === "string") {
    ip = forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded)) {
    ip = forwarded[0]?.trim() || "unknown";
  } else {
    ip = req.ip || req.socket?.remoteAddress || "unknown";
  }

  return ip.replace("::ffff:", "").trim();
};

/*
 * Memory fallback
 */

const cleanData = () => {
  const now = Date.now();

  for (const [ip, data] of ipData) {
    data.requests = data.requests.filter(
      (time) => now - time < WINDOW_TIME
    );

    if (data.requests.length === 0 && data.bannedUntil <= now) {
      ipData.delete(ip);
    }
  }
};

setInterval(cleanData, Math.max(WINDOW_TIME, 60000)).unref();

/*
 * Redis rate limiter
 *
 * Redis key:
 * ratelimit:{ip}:{window}
 *
 * Ban key:
 * ratelimit:ban:{ip}
 */

const redisRateLimit = async (
  req: Request,
  res: Response,
  ip: string,
  now: number
): Promise<boolean> => {
  if (!redis) return false;

  const banKey = `ratelimit:ban:${ip}`;

  try {
    /*
     * Check active ban
     */

    const bannedUntil = await redis.get<number>(banKey);

    if (bannedUntil && bannedUntil > now) {
      const remaining = Math.ceil((bannedUntil - now) / 1000);
      res.setHeader("Retry-After", remaining);
      return true;
    }

    /*
     * Use a fixed window.
     *
     * Example:
     * 10:20:31.000 - 10:20:31.999
     * 10:20:32.000 - 10:20:32.999
     */

    const windowStart = Math.floor(now / WINDOW_TIME) * WINDOW_TIME;
    const windowKey = `ratelimit:${ip}:${windowStart}`;

    /*
     * Atomic increment.
     */

    const count = await redis.incr(windowKey);

    /*
     * Give the counter an expiration.
     */

    if (count === 1) {
      const ttl = Math.ceil(WINDOW_TIME / 1000);
      await redis.expire(windowKey, Math.max(ttl, 1));
    }

    /*
     * Limit exceeded.
     */

    if (count > MAX_REQUESTS) {
      const bannedUntil = now + BAN_TIME;

      await redis.set(banKey, bannedUntil, { px: BAN_TIME });
      await redis.del(windowKey);

      logRateLimit(req);

      res.setHeader("Retry-After", Math.ceil(BAN_TIME / 1000));
      res.status(429).json({
        status: false,
        message: "Too many requests. You are temporarily banned"
      });

      return true;
    }

    return false;
  } catch (error) {
    /*
     * Redis failure should not make
     * the entire API unavailable.
     *
     * Fall back to memory limiter.
     */

    console.error("[RateLimit] Redis error:", error);
    return false;
  }
};

/*
 * Memory rate limiter
 */

const memoryRateLimit = (
  req: Request,
  res: Response,
  ip: string,
  now: number
): boolean => {
  let data = ipData.get(ip);

  if (!data) {
    data = { requests: [], bannedUntil: 0 };
    ipData.set(ip, data);
  }

  /*
   * Check active ban.
   */

  if (data.bannedUntil > now) {
    const remaining = Math.ceil((data.bannedUntil - now) / 1000);
    res.setHeader("Retry-After", remaining);

    res.status(429).json({
      status: false,
      message: "Too many requests. You are temporarily banned"
    });

    return true;
  }

  /*
   * Remove expired requests.
   */

  data.requests = data.requests.filter(
    (time) => now - time < WINDOW_TIME
  );

  /*
   * Add current request.
   */

  data.requests.push(now);

  /*
   * Check limit.
   */

  if (data.requests.length > MAX_REQUESTS) {
    data.bannedUntil = now + BAN_TIME;
    data.requests = [];

    logRateLimit(req);

    res.setHeader("Retry-After", Math.ceil(BAN_TIME / 1000));
    res.status(429).json({
      status: false,
      message: "Too many requests. You are temporarily banned"
    });

    return true;
  }

  return false;
};

/*
 * Main middleware
 */

export const rateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = getIp(req);
  const now = Date.now();

  /*
   * Vercel / VPS with Upstash
   */

  if (redis) {
    const blocked = await redisRateLimit(req, res, ip, now);

    if (blocked) return;

    return next();
  }

  /*
   * Fallback when Redis
   * environment variables
   * are not configured.
   */

  if (memoryRateLimit(req, res, ip, now)) return;

  next();
};
