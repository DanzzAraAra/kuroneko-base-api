/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (res.headersSent) {
        return next(error);
    }

    const message =
        error instanceof Error
            ? error.message
            : 'Internal Server Error';
            
    console.error(
        `[ERROR] ${req.method} ${req.originalUrl}`,
        error
    );

    return res.status(500).json({
        status: false,
        message: 'Internal Server Error'
    });
};