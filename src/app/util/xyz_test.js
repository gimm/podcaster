#!/usr/bin/env node

const { xyzUploader } = require('./xyz_uploader')
const path = require('path')

/**
 * 小宇宙播客上传示例
 */
async function runExample() {
    console.log('===== 小宇宙播客上传示例 =====')

    // 播客标题
    const title = '测试播客标题 ' + new Date().toLocaleString()

    // 音频文件路径（请替换为实际文件路径）
    const mp3path = '/app/public/mp3/2025-3-25.mp3'

    // 日志函数
    const logger = message => console.log(`[${new Date().toLocaleTimeString()}] ${message}`)

    try {
        console.log('开始上传播客...')

        // 新的简化调用方式
        const result = await xyzUploader(title, mp3path, {
            // podcastId: '您的播客ID',  // 可选
            // chromePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',  // 例如：C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe
            // tokenFile: './my-token.json',  // 指定一个自定义token文件路径
            headless: true,  // 设置为false可以看到浏览器操作过程，便于调试
            logger: logger
        })

        if (result) {
            console.log('✅ 播客上传成功!')
        } else {
            console.log('❌ 播客上传失败')
        }
    } catch (error) {
        console.error('上传过程中发生错误:', error.message)
    }
}

// 运行示例
runExample().catch(err => {
    console.error('程序执行错误:', err)
})