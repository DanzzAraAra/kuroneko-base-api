/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import 'dotenv/config';
import express, {
    Request,
    Response,
    NextFunction
} from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { rateLimit } from './src/middleware/rateLimit';
import { errorHandler } from './src/middleware/errorHandler';
import {
    loadRouter,
    initAutoLoad,
    buildConfig
} from './src/autoload';

const app = express();
const port = Number(process.env.PORT); // atur di file .env
const recentRequests: string[] = [];
if (!port) {
    console.error('[✗] PORT is not configured');
    process.exit(1);
}
app.set('trust proxy', true);
const configPaths = [
    path.join(__dirname, 'src', 'config.json'),
    path.join(__dirname, '..', 'src', 'config.json'),
    path.join(process.cwd(), 'src', 'config.json'),
    '/var/task/src/config.json'
];

const findConfig = () => {
    for (const file of configPaths) {
        if (fs.existsSync(file)) return file;
    }

    console.error('[✗] Config file not found');
    process.exit(1);
};

const configPath = findConfig();
const config = buildConfig(configPath, process.cwd());

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

const logRequest = (req: Request, res: Response) => {
    const ignoredPaths = [
        '/stats',
        '/stats/data',
        '/src',
        '/docs',
        '/config',
        '/favicon.ico',
        '/',
        '/landing'
    ];

    if (ignoredPaths.some((item) => req.path.startsWith(item))) {
        return;
    }

    const cleanUrl = req.originalUrl.replace(/(=)[^&]+/g, '$1');
    const url = `${req.protocol}://${req.get('host')}${cleanUrl}`;

    recentRequests.push(`[${req.method}] [${res.statusCode}] ${url}`);

    if (recentRequests.length > 50) recentRequests.shift();
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => logRequest(req, res));
    next();
});

app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/src', express.static(path.join(process.cwd(), 'src')));

app.use(rateLimit); // rate limiter
loadRouter(app, config); // endpoints router

app.get('/stats/data', (req: Request, res: Response) => {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpus = os.cpus();
        return res.json({
            status: true,
            server: {
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                uptime: formatUptime(os.uptime()),
                node_version: process.version,
                memory: {
                    total: formatBytes(totalMemory),
                    used: formatBytes(usedMemory),
                    free: formatBytes(freeMemory),
                    percent: Math.round((usedMemory / totalMemory) * 100)
                },
                cpu: {
                    model: cpus[0]?.model || 'Unknown',
                    speed: `${cpus[0]?.speed || 0} MHz`,
                    cores: cpus.length,
                    load: os.loadavg()[0].toFixed(2)
                }
            },
            requests: recentRequests
        });
    } catch {
        return res.status(500).json({ status: false });
    }
});

app.get('/stats', (req: Request, res: Response) => {
    return res.sendFile(
        path.join(process.cwd(), 'public', 'stats', 'stats.html')
    );
});

app.get('/config', (req: Request, res: Response) => {
    try {
        return res.json({
            creator: config.settings.creator,
            ...config
        });
    } catch {
        return res.status(500).json({
            creator: config.settings.creator,
            error: 'Internal Server Error'
        });
    }
});

app.get('/', (req: Request, res: Response) => {
    return res.sendFile(
        path.join(process.cwd(), 'public', 'landing', 'landing.html')
    );
});

app.get('/docs', (req: Request, res: Response) => {
    return res.sendFile(
        path.join(process.cwd(), 'public', 'docs', 'docs.html')
    );
});

app.use((req: Request, res: Response) => {
    if (req.accepts('html')) {
        const files = [
            path.join(process.cwd(), 'public', '404.html'),
            path.join(__dirname, 'public', '404.html')
        ];

        for (const file of files) {
            if (fs.existsSync(file)) {
                return res.status(404).sendFile(file);
            }
        }
    }

    return res.status(404).json({
        status: false,
        creator: config.settings.creator,
        message: 'Route not found'
    });
});

app.use(errorHandler);
initAutoLoad(app, config, configPath);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;