import cron from 'node-cron'
import fetch from 'node-fetch' // 或者使用 axios

// 你的 API 地址
const apiUrl = 'https://mars.sunlands.com/podcaster/api/mp3'

// 创建一个定时任务，周一到周五，每天早上6点执行一次
// cron 表达式 '0 6 * * 1-5' 表示周一到周五的6:00执行
const task = cron.schedule('0 6 * * 1-5', async () => {
    console.log(`[${new Date().toISOString()}] 触发任务，尝试请求 ${apiUrl}`)

    try {
        const response = await fetch(apiUrl, { method: 'POST' })
        const data = await response.json()

        console.log(`[${new Date().toISOString()}] 收到响应:`, data)
        // 不管返回结果如何，都继续运行任务
        console.log(`[${new Date().toISOString()}] 任务执行完成，将在下一个工作日早上6点再次执行`)

    } catch (error) {
        console.error(`[${new Date().toISOString()}] 请求失败:`, error)
        // 即使出错也继续运行任务
    }
}, {
    scheduled: false // 初始化时不立即执行，等待 start()
})

// 启动任务
console.log(`[${new Date().toISOString()}] 启动定时任务，将在每个工作日早上6:00执行`)
task.start()

// 让脚本持续运行 (例如，在服务器环境中通常由 PM2 管理)
// 在本地测试时，可以用下面的方法保持进程不退出
// process.stdin.resume()