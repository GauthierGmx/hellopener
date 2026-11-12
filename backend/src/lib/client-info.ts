import { Request } from "express";

export type ClientInfo = {
    ip: string | null;
    userAgent: string | null;
};

export function getClientInfo(req: Request): ClientInfo {
    const rawIp = req.ip;
    const rawUserAgent = req.headers["user-agent"];

    const ip = typeof rawIp === "string" ? rawIp.slice(0,45) : null;                        // Keep the 45 carac from the IP
    const userAgent = typeof rawUserAgent === "string" ? rawUserAgent?.slice(0,255) : null; // Keep the 255 carac from the UserAgent headers

    return {ip, userAgent};
}