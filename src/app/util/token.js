const fs = require('fs')
const path = require('path')

// 监听并拦截网络请求
const updateTokens = async (jsonData, tokenDataInUse) => {
    try {
        const updateAt = new Date().toLocaleTimeString();
        const data = jsonData
        console.log('获取 TOKEN', updateAt, data);
        // 提取新的token
        const newAccessToken = data['x-jike-access-token']
        const newRefreshToken = data['x-jike-refresh-token']

        if (newAccessToken && newRefreshToken) {
            // 读取当前token文件
            const tokenPath = path.resolve(__dirname, 'token.json')
            const tokenFile = fs.readFileSync(tokenPath, 'utf8')
            const tokenData = JSON.parse(tokenFile)

            // 更新token值
            tokenFile.updateAt = updateAt
            tokenData.accessToken = newAccessToken
            tokenData.refreshToken = newRefreshToken

            // 保存回文件
            fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 4), 'utf8')

            console.log('令牌已自动更新')

            // 更新请求头部的token
            tokenDataInUse.accessToken = newAccessToken
            tokenDataInUse.refreshToken = newRefreshToken
        }
    } catch (error) {
        console.error('更新令牌时出错:', error)
    }
}


const setupTokenRefreshInterceptor = (page, tokenDataInUse) => {
    page.on('response', async response => {
        if (response.request().resourceType() === 'xhr' && /app_auth_tokens/.test(response.url())) {
            const data = await response.json();
            updateTokens(data, tokenDataInUse);
        }
      });
}

// 导出功能
module.exports = {
    setupTokenRefreshInterceptor
}