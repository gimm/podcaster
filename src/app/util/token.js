const fs = require('fs')
const path = require('path')

// 监听并拦截网络请求
const updateTokens = async (response) => {
    try {
        // 检查URL是否匹配
        if (response.url.includes('https://podcaster-api.xiaoyuzhoufm.com/app_auth_tokens.refresh')) {
            // 获取响应数据
            const data = await response.json()

            // 提取新的token
            const newAccessToken = data['x-jike-access-token']
            const newRefreshToken = data['x-jike-refresh-token']

            if (newAccessToken && newRefreshToken) {
                // 读取当前token文件
                const tokenPath = path.resolve(__dirname, 'token.json')
                const tokenFile = fs.readFileSync(tokenPath, 'utf8')
                const tokenData = JSON.parse(tokenFile)

                // 更新token值
                tokenData.accessToken = newAccessToken
                tokenData.refreshToken = newRefreshToken

                // 保存回文件
                fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 4), 'utf8')

                console.log('令牌已自动更新')

                // 更新请求头部的token
                updateRequestHeaders(newAccessToken, newRefreshToken)
            }
        }
    } catch (error) {
        console.error('更新令牌时出错:', error)
    }
}

// 更新请求头部
const updateRequestHeaders = (accessToken, refreshToken) => {
    // 这里可以根据你的应用程序架构来实现
    // 例如，如果使用axios:
    global.requestHeaders = {
        ...global.requestHeaders,
        'x-jike-access-token': accessToken,
        'x-jike-refresh-token': refreshToken
    }
}

// 添加一个标志变量避免重复初始化
let isInterceptorSetup = false

const setupTokenRefreshInterceptor = () => {
    // 防止重复设置
    if (isInterceptorSetup) {
        console.log('令牌刷新拦截器已经设置，跳过重复初始化')
        return
    }

    // 这里是原来的拦截器设置代码
    const originalFetch = global.fetch
    global.fetch = async (...args) => {
        const response = await originalFetch(...args)

        // 创建响应的克隆以便多次读取
        const clone = response.clone()
        updateTokens(clone).catch(console.error)

        return response
    }

    isInterceptorSetup = true
    console.log('令牌刷新拦截器设置成功')
}

// 导出功能
module.exports = {
    setupTokenRefreshInterceptor
}