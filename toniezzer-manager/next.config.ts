import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Marcar pacotes Node.js como externos para evitar problemas no build
  serverExternalPackages: [
    'imapflow',
    'pino',
    'pino-pretty',
    'thread-stream',
    'xml2js',
    'sonic-boom',
  ],
  
  // Permitir imagens do Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hugcvafgqcptxkhtueyv.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
