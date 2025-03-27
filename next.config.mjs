/** @type {import('next').NextConfig} */

import config from './src/app/util/config.js'
const nextConfig = {
    // 只在生产环境下设置assetPrefix
    assetPrefix: config.PUBLIC_URL,
};

export default nextConfig;
