const fs = require('fs')
const path = require('path')

const TOKEN_FILE_PATH = path.resolve(__dirname, 'token.json')


const tokenSetup = async (context, page) => {
    // 设置localStorage
    await context.addInitScript(value => {
        try {
            window.localStorage.setItem('_jt', value)
            console.log('localStorage 设置成功')
        } catch (error) {
            console.error('设置 localStorage 时出错:', error)
        }
    }, getTokenFromStorage())

    // 然后设置响应拦截
    page.on('response', async response => {
        if (response.request().resourceType() !== 'xhr' || !/app_auth_tokens/.test(response.url())) {
            return
        }

        try {
            const {
                'x-jike-access-token': accessToken,
                'x-jike-refresh-token': refreshToken
            } = await response.json();
            const updateAt = new Date().toLocaleString();
            console.log('\n\n获取 TOKEN\n', updateAt);
            // 提取新的token

            if (accessToken && refreshToken) {
                // 读取当前token文件
                const token = btoa(JSON.stringify({
                    accessToken,
                    refreshToken
                }))
                const tokenObj = {
                    updateAt,
                    token,
                }


                // 保存回文件
                fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokenObj, null, 4), 'utf8')

                // 更新localStorage
                await page.evaluate(value => {
                    try {
                        window.localStorage.setItem('_jt', value)
                        console.log('localStorage 设置成功')
                    } catch (error) {
                    }
                }, token)
                console.log('令牌已自动更新')
            }
        } catch (error) {
            console.error('更新令牌时出错:', error)
        }


    });
}


const getTokenFromStorage = () => {
    // 读取token文件
    try {
        const tokenContent = fs.readFileSync(path.join(process.cwd(), 'token.json'), 'utf8')
        return JSON.parse(tokenContent).token
    } catch (error) {
        throw new Error(`无法读取token文件: ${error.message}`)
    }
}


// 导出功能
module.exports = {
    tokenSetup,
}