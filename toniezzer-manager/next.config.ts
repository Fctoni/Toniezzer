import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Marcar pacotes Node.js como externos para evitar problemas no build
  serverExternalPackages: [
    'imapflow',
    'pino',
    'pino-pretty',
    'thread-stream',
    'pdf-parse',
    'xml2js',
    'sonic-boom',
  ],
};

export default nextConfig;
