import { Request, Response } from 'express';
import axios from 'axios';
import qs from 'qs';
import * as cheerio from 'cheerio';

async function getFdownTokens() {
    const { data } = await axios.get('https://fdown.net', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
            'Accept-Language': 'id-ID',
            'Upgrade-Insecure-Requests': '1',
        }
    });
    const $ = cheerio.load(data);
    return {
        token_v: $('input[name="token_v"]').val() as string,
        token_c: $('input[name="token_c"]').val() as string,
        token_h: $('input[name="token_h"]').val() as string
    };
}

async function facebookDl(url: string) {
    try {
        const tokens = await getFdownTokens();
        const postData = qs.stringify({
            'URLz': url,
            'token_v': tokens.token_v,
            'token_c': tokens.token_c,
            'token_h': tokens.token_h
        });

        const { data } = await axios.post('https://fdown.net/download.php', postData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8',
                'Content-Type': 'application/x-www-form-urlencoded',
                'accept-language': 'id-ID',
                'referer': 'https://fdown.net/',
            }
        });

        const $ = cheerio.load(data);

        if ($('.alert-danger').length > 0) {
            throw new Error("Video is private or URL is invalid");
        }

        const title = $('.lib-row.lib-header').text().trim() || "Facebook Video";
        const description = $('.lib-row.lib-desc').text().trim() || "No Description";
        const sdLink = $('#sdlink').attr('href');
        const hdLink = $('#hdlink').attr('href');

        if (!sdLink && !hdLink) {
            throw new Error("No download links found");
        }

        return {
            title,
            description,
            sd: sdLink || "",
            hd: hdLink || ""
        };
    } catch (e: any) {
        throw new Error(e.message || "Failed to download Facebook video");
    }
}

export default async function facebookHandler(req: Request, res: Response) {
    const url = (req.query.url || req.body.url) as string;

    if (!url) return res.status(400).json({ status: false, message: "URL required" });

    try {
        const result = await facebookDl(url);
        res.json({ status: true, data: result });
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message });
    }
}