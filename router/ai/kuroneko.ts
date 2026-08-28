/*
 * KuroNeko API | sylvatica.my.id
 * © Dandy
 */
import { Request, Response } from 'express';
import axios from 'axios';

const defaultPrompt =
    'Nama kamu adalah KuroNeko, ingat kamu itu bukan ai, sifat kamu baik hati dan suka menolong, ingat pakai gaya bicara kaya chat chatan di WhatsApp pendek aja';

async function chatWithGemini(
    message: string,
    instruction: string = defaultPrompt,
    sessionId: string | null = null
) {
    try {
        let resumeArray: any = null;
        let cookie = '';
        let savedInstruction = instruction;
        if (sessionId) {
            try {
                const sessionData = JSON.parse(
                    Buffer.from(sessionId, 'base64').toString()
                );
                resumeArray = sessionData.resumeArray;
                cookie = sessionData.cookie || '';
                if (
                    sessionData.instruction &&
                    instruction === defaultPrompt
                ) {
                    savedInstruction = sessionData.instruction;
                }
            } catch {}
        }
        if (!cookie) {
            const response = await axios.post(
                'https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c',
                'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
                {
                    headers: {
                        'Content-Type':
                            'application/x-www-form-urlencoded;charset=UTF-8'
                    }
                }
            );

            const cookies = response.headers['set-cookie'];

            if (cookies?.length) {
                cookie = cookies[0].split(';')[0];
            }
        }

        if (!resumeArray) {
            resumeArray = [
                '',
                '',
                '',
                null,
                null,
                null,
                null,
                null,
                null,
                ''
            ];
        }

        const requestBody = [
            [message, 0, null, null, null, null, 0],
            ['en-US'],
            resumeArray,
            null,
            null,
            null,
            [1],
            1,
            null,
            null,
            1,
            0,
            null,
            null,
            null,
            null,
            null,
            [[0]],
            1,
            null,
            null,
            null,
            null,
            null,
            [
                '',
                '',
                savedInstruction,
                null,
                null,
                null,
                null,
                null,
                0,
                null,
                1,
                null,
                null,
                null,
                []
            ],
            null,
            null,
            1,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
                18,
                19,
                20
            ],
            1,
            null,
            null,
            null,
            null,
            [1]
        ];

        const payload = [
            null,
            JSON.stringify(requestBody)
        ];

        const response = await axios.post(
            'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c',
            new URLSearchParams({
                'f.req': JSON.stringify(payload)
            }).toString(),
            {
                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded;charset=UTF-8',
                    'x-goog-ext-525001261-jspb':
                        '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
                    Cookie: cookie
                }
            }
        );

        const body = String(response.data);

        const regex = /^\d+\n(.+?)\n/gm;
        const matches = [...body.matchAll(regex)];

        let responseText = '';
        let newResumeArray: any[] | null = null;

        for (let i = matches.length - 1; i >= 0; i--) {
            try {
                const chunk = JSON.parse(matches[i][1]);

                if (!Array.isArray(chunk) || chunk.length === 0) {
                    continue;
                }

                const chunk0 = chunk[0];

                if (
                    !Array.isArray(chunk0) ||
                    chunk0.length <= 2
                ) {
                    continue;
                }

                const chunk0String = chunk0[2];

                if (typeof chunk0String !== 'string') {
                    continue;
                }

                const parse1 = JSON.parse(chunk0String);

                if (
                    !Array.isArray(parse1) ||
                    parse1.length <= 4
                ) {
                    continue;
                }

                const p4 = parse1[4];

                if (
                    !Array.isArray(p4) ||
                    p4.length === 0
                ) {
                    continue;
                }

                const p40 = p4[0];

                if (
                    !Array.isArray(p40) ||
                    p40.length <= 1
                ) {
                    continue;
                }

                const p401 = p40[1];

                if (
                    !Array.isArray(p401) ||
                    p401.length === 0
                ) {
                    continue;
                }

                const finalText = p401[0];

                if (typeof finalText !== 'string') {
                    continue;
                }

                responseText = finalText.replace(
                    /\*\*/g,
                    '*'
                );

                const p1 = Array.isArray(parse1[1])
                    ? parse1[1]
                    : [];

                newResumeArray = [
                    ...p1,
                    p40[0]
                ];

                break;
            } catch {
                continue;
            }
        }

        if (!responseText || !newResumeArray) {
            throw new Error(
                'Failed to find AI reply. The response structure may change or be empty'
            );
        }

        const newSessionId = Buffer.from(
            JSON.stringify({
                resumeArray: newResumeArray,
                cookie,
                instruction: savedInstruction
            })
        ).toString('base64');

        return {
            status: true,
            response: responseText,
            session: newSessionId
        };
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unknown error';

        throw new Error(
            `Gagal mengambil respon dari AI: ${message}`
        );
    }
}

export default async function kuronekoHandler(
    req: Request,
    res: Response
) {
    const q = String(
        req.query.q ||
        req.body?.q ||
        ''
    );

    const session = String(
        req.query.session ||
        req.body?.session ||
        ''
    );

    if (!q) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'q' is required"
        });
    }

    try {
        const result = await chatWithGemini(
            q,
            defaultPrompt,
            session || null
        );

        return res.json(result);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Internal Server Error';

        return res.status(500).json({
            status: false,
            message
        });
    }
}