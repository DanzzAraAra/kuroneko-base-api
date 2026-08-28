/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import { Request, Response, NextFunction } from 'express';

import { logRateLimit } from '../logger';

const MAX_REQUESTS = Number(
    process.env.RATE_LIMIT_MAX_REQUESTS
);
const WINDOW_TIME = Number(
    process.env.RATE_LIMIT_WINDOW
);
const BAN_TIME = Number(
    process.env.RATE_LIMIT_BAN_TIME
);

if (
    !MAX_REQUESTS ||
    !WINDOW_TIME ||
    !BAN_TIME
) {
    throw new Error(
        'Rate limit configuration is missing in .env'
    );
}

type IpData = {
    requests: number[];
    bannedUntil: number;
};

const ipData = new Map<string, IpData>();

const getIp = (req: Request): string => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return ip.replace('::ffff:', '').trim();
};

const cleanData = () => {
    const now = Date.now();
    for (const [ip, data] of ipData) {
        data.requests = data.requests.filter(
            (time) => now - time < WINDOW_TIME
        );
        if (
            data.requests.length === 0 &&
            data.bannedUntil <= now
        ) {
            ipData.delete(ip);
        }
    }
};

setInterval(
    cleanData,
    Math.max(WINDOW_TIME, 60000)
).unref();

export const rateLimit = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const ip = getIp(req);
    const now = Date.now();
    let data = ipData.get(ip);
    if (!data) {
        data = {
            requests: [],
            bannedUntil: 0
        };
        ipData.set(ip, data);
    }

    if (data.bannedUntil > now) {
        const remaining = Math.ceil(
            (data.bannedUntil - now) / 1000
        );

        res.setHeader(
            'Retry-After',
            remaining
        );

        return res.status(429).json({
            status: false,
            message: 'Too many requests. You are temporarily banned'
        });
    }

    data.requests = data.requests.filter(
        (time) => now - time < WINDOW_TIME
    );

    data.requests.push(now);

    if (
        data.requests.length >
        MAX_REQUESTS
    ) {
        data.bannedUntil = now + BAN_TIME;
        data.requests = [];

        logRateLimit(req);

        res.setHeader('Retry-After', Math.ceil(BAN_TIME / 1000)
        );

        return res.status(429).json({
            status: false,
            message: 'Too many requests. You are temporarily banned'
        });
    }

    next();
};