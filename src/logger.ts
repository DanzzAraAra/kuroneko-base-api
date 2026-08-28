/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import { Request, Response } from 'express';

export const logRouterRequest = (
    req: Request,
    res: Response
) => {
    res.on('finish', () => {
        let ip =
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            '';
        if (Array.isArray(ip)) {
            ip = ip[0];
        }
        if (typeof ip === 'string') {
            ip = ip.split(',')[0].trim();
            ip = ip.replace('::ffff:', '');
        }
        const status = res.statusCode;
        const url = `${req.protocol}://${req.get(
            'host'
        )}${req.originalUrl}`;
        let color = '\x1b[0m';
        if (status >= 500) {
            color = '\x1b[31m';
        } else if (status >= 400) {
            color = '\x1b[33m';
        } else if (status >= 300) {
            color = '\x1b[36m';
        } else if (status >= 200) {
            color = '\x1b[32m';
        }
        console.log(
            `[${ip}] = ${color}[${status}]\x1b[0m ${url}`
        );
    });
};

export const logRateLimit = (
    req: Request
) => {
    let ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '';
    if (Array.isArray(ip)) {
        ip = ip[0];
    }
    if (typeof ip === 'string') {
        ip = ip.split(',')[0].trim();
        ip = ip.replace('::ffff:', '');
    }
    console.log(
        `[${ip}] = \x1b[31m[429]\x1b[0m RATE LIMIT BAN`
    );
};