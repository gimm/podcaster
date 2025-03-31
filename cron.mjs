import cron from 'node-cron'
import fetch from 'node-fetch' // 或者使用 axios

// 你的 API 地址
const apiUrl = 'https://mars.sunlands.com/podcaster/api/mp3'

// 创建一个定时任务，周一到周五，每 5 分钟执行一次
// cron 表达式 '*/5 6-23 * * 1-5' 表示周一到周五的 6:00 到 23:55 每 5 分钟执行
// 你可以根据需要调整时间范围，比如只在早上 '*/5 6 * * 1-5' (6:00 - 6:55)
const task = cron.schedule('*/5 6 * * 1-5', async () => {
    console.log(`[${new Date().toISOString()}] 触发任务，尝试请求 ${apiUrl}`)

    try {
        const response = await fetch(apiUrl, { method: 'POST' })
        const data = await response.json()

        console.log(`[${new Date().toISOString()}] 收到响应:`, data)

        // 检查 success 字段是否为 false
        if (data.success === false) {
            console.log(`[${new Date().toISOString()}] success 为 false，停止定时任务。原因: ${data.message || '未指定'}`)
            task.stop() // 停止当前定时任务
        } else {
            // 如果 success 不为 false (可能为 true 或 undefined)，则继续等待下一次触发
             console.log(`[${new Date().toISOString()}] success 不为 false，任务将继续运行。`)
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 请求失败:`, error)
        // 根据需要决定是否在出错时也停止任务
        // task.stop()
    }
}, {
    scheduled: false // 初始化时不立即执行，等待 start()
})

// 启动任务
console.log(`[${new Date().toISOString()}] 启动定时任务，将在每个工作日 6:00 - 6:55 (根据 cron 表达式) 每 5 分钟尝试请求 API...`)
task.start()

// 让脚本持续运行 (例如，在服务器环境中通常由 PM2 管理)
// 在本地测试时，可以用下面的方法保持进程不退出
// process.stdin.resume()