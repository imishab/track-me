/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  sw: "workbox-sw.js", // PWA worker; use /sw.js for PushAlert (download from dashboard)
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {};

module.exports = withPWA(nextConfig);
