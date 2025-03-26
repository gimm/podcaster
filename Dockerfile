# 第一阶段：构建环境
FROM node:18-bullseye-slim AS builder

# 配置国内镜像源加速（清华源）
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list \
    && sed -i 's/security.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

# 安装系统级依赖（注意行尾必须加 \ ）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libnss3 \
    libx11-xcb1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxcomposite1 \
    ttf-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*  # 清理缓存必须在同一行

# 安装 Playwright
RUN npm config set registry https://registry.npmmirror.com \
    && npm install playwright@1.42.0 -g \
    && npx playwright install-deps chromium \
    && npx playwright install chromium

# 第二阶段：生产环境
FROM node:18-bullseye-slim
WORKDIR /app

# 复制构建结果
COPY --from=builder /usr/local/ /usr/local/
COPY --from=builder /etc/apt/sources.list /etc/apt/sources.list
COPY --from=builder /usr/lib/chromium /usr/lib/chromium

# 验证环境
RUN node -v \
    && npm -v \
    && ffmpeg -version \
    && npx playwright --version

# 部署应用
