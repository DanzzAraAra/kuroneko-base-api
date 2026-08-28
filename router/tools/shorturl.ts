import { Request, Response } from 'express';
import axios from 'axios';

export default async function shortUrlHandler(req: Request, res: Response) {
    const url = String(req.query.url || req.body.url || '').trim();
    const alias = String(req.query.alias || req.body.alias || '').trim();

    if (!url) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'url' diperlukan."
        });
    }

    if (!url.startsWith('http')) {
        return res.status(400).json({
            status: false,
            message: 'URL harus diawali dengan http:// atau https://'
        });
    }

    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}&alias=${encodeURIComponent(alias)}`;
    const response = await axios.get(apiUrl);

    if (response.data === 'Error') {
        return res.status(400).json({
            status: false,
            message: 'Custom Alias ini sudah dipakai orang lain. Coba nama lain.'
        });
    }

    return res.json({
        status: true,
        result: response.data
    });
}