# 构建环境
FROM node:18-bullseye-slim

# 设置工作目录
WORKDIR /app

# 设置时区环境变量
ENV TZ=Asia/Shanghai

# 配置国内镜像源加速
RUN sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list \
    && sed -i 's/security.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list

# 安装系统级依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libnss3 \
    libx11-xcb1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxcomposite1 \
    ttf-wqy-microhei \
    && rm -rf /var/lib/apt/lists/* \
    # 设置时区
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# 配置 npm
RUN npm config set registry https://registry.npmmirror.com

# 复制项目依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制项目文件
COPY . .

# 构建应用
RUN npm run build

# 验证环境
RUN node -v \
    && npm -v \
    && ffmpeg -version \
    && date

# 启动命令
CMD ["npm", "run", "start"]
