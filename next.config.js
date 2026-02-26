/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    cacheStartUrl: true,
    dynamicStartUrl: true,
});

const nextConfig = {
    turbopack: {},
};

export default withPWA(nextConfig);
