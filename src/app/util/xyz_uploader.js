#!/usr/bin/env node

const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const { setupTokenRefreshInterceptor } = require('./token')


/**
 * 小宇宙播客上传工具
 *
 * @param {string} title - 播客标题
 * @param {string} mp3path - MP3文件路径
 * @param {Object} options - 可选配置
 * @param {string} options.podcastId - 播客ID，默认为67c97140bfa2a84cabe29fe0
 * @param {string} options.tokenFile - token.json文件路径，默认为当前目录下的token.json
 * @param {boolean} options.headless - 是否以无头模式运行，默认为false
 * @param {string} options.chromePath - 自定义Chrome路径
 * @param {Function} options.logger - 日志函数，默认为console.log
 * @returns {Promise<boolean>} - 上传是否成功
 */
async function xyzUploader(title, mp3path, options = {}) {
    // 验证必填参数
    if (!title) {
        throw new Error('缺少播客标题')
    }

    if (!mp3path || !fs.existsSync(mp3path)) {
        throw new Error(`音频文件不存在: ${mp3path}`)
    }

    // 默认配置
    const config = {
        podcastId: options.podcastId || '67c97140bfa2a84cabe29fe0',
        tokenFile: options.tokenFile || path.join(process.cwd(), 'token.json'),
        headless: options.headless !== undefined ? options.headless : false,
        chromePath: options.chromePath,
        logger: options.logger || console.log
    }

    const log = config.logger

    // 读取token文件
    log('读取认证信息...')
    let tokenData
    try {
        const tokenContent = fs.readFileSync(config.tokenFile, 'utf8')
        tokenData = JSON.parse(tokenContent)
    } catch (error) {
        throw new Error(`无法读取token文件: ${error.message}`)
    }

    if (!tokenData.storage_jt || !tokenData.accessToken || !tokenData.refreshToken) {
        throw new Error('token文件缺少必要的字段: storage_jt, accessToken, refreshToken')
    }

    // 启动浏览器
    log('启动浏览器...')

    const browserOptions = {
        headless: config.headless,
        slowMo: 50,
        args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox'
        ]
    }

    if (config.chromePath) {
        browserOptions.executablePath = config.chromePath
    }

    let browser
    let success = false

    try {
        browser = await chromium.launch(browserOptions)
        const context = await browser.newContext()

        // 设置请求拦截器
        log('配置请求拦截器...')
        await context.route('**/*', async route => {
            const request = route.request()
            const headers = {
                ...request.headers(),
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh;q=0.6",
                "content-type": "application/json;charset=UTF-8",
                "X-Jike-Access-Token": tokenData.accessToken,
                "X-Jike-Refresh-Token": tokenData.refreshToken,
                "X-Pid": config.podcastId
            }

            route.continue({ headers })
        })

        // 创建新页面
        log('创建页面...')
        const page = await context.newPage()

        setupTokenRefreshInterceptor(page, tokenData)

        // 设置localStorage
        const localStorageScript = `
        () => {
            const baseUrl = 'https://podcaster.xiaoyuzhoufm.com';
            const currentUrl = window.location.origin;
            if (currentUrl.includes('xiaoyuzhoufm.com')) {
                localStorage.setItem('_jt', '${tokenData.storage_jt}');
                console.log('已设置 _jt 值到 localStorage');

                if (!window._jtSet) {
                    window._jtSet = true;
                    location.reload();
                }
            }
        }`;

        // 导航到目标URL
        log('导航到小宇宙发布页面...')
        const url = `https://podcaster.xiaoyuzhoufm.com/podcasts/${config.podcastId}/create/episode`
        await page.goto(url)

        // 设置localStorage
        log('设置认证信息...')
        await page.evaluate(localStorageScript)

        // 等待页面加载完成
        log('等待页面加载完成...')
        await page.waitForLoadState('networkidle')

        // 执行上传流程
        log('开始上传流程...')

        // 1. 填写标题
        log(`填写标题: ${title}`)
        await page.fill('input[placeholder="输入单集标题"]', title)


        // 2. 上传音频文件
        log(`等待十秒`)
        await page.waitForTimeout(10000)
        log(`上传音频文件: ${mp3path}`)
        const audioInput = await page.locator('#upload')
        await audioInput.setInputFiles(path.resolve(mp3path))

        // 3. 等待上传完成
        log('等待音频上传完成...')
        await page.waitForSelector('#audio_card_play_icon', { timeout: 180000 }) // 3分钟超时
        log('音频上传完成!')

        // 4. 同意条款
        log('同意服务条款...')
        const termsElement = await page.locator('text=阅读并同意')
        await termsElement.evaluate((element) => element.previousSibling.click())


        // 5. 点击创建按钮
        log('点击创建按钮...')
        await page.getByText('创建', { exact: true }).click()

        // 等待创建完成
        log('等待创建完成...')
        await page.waitForTimeout(5000)

        log('上传流程完成!')
        success = true
        return true

    } catch (error) {
        log(`上传失败: ${error.message}`)
        if (error.stack) {
            log(error.stack)
        }
        return false
    } finally {
        if (browser) {
            log('关闭浏览器...')
            await browser.close()
        }
    }
}

// 导出工具函数
module.exports = { xyzUploader }