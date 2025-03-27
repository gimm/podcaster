import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { fetchReadhubDaily } from '@/app/util/readhub.daily'
import { submitTask } from '@/app/util/seedtts'
import { PUBLIC_URL } from '@/app/util/config'


// MP3 文件存储路径
const MP3_DIR = path.join(process.cwd(), "storage", "mp3")

// 确保 MP3 目录存在
if (!fs.existsSync(MP3_DIR)) {
    fs.mkdirSync(MP3_DIR, { recursive: true })
}


// 获取 MP3 文件列表
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 5
    try {
        const files = fs.readdirSync(MP3_DIR)
        const total = files.length

        // 创建 Promise 数组
        const mp3FilesPromises = files
            .filter(file => file.endsWith(".mp3"))
            .map(file => {
                const stats = fs.statSync(path.join(MP3_DIR, file))
                return {
                    id: file.replace(".mp3", ""),
                    name: file.replace(".mp3", "").replace(/-/g, " "),
                    path: `${PUBLIC_URL}file/${file}`,
                    size: stats.size,
                    lastModified: stats.mtime,
                }
            })
            .sort((a, b) => b.lastModified - a.lastModified)
            .slice(0, limit)

        return NextResponse.json({
            total,
            mp3Files: mp3FilesPromises,
        })
    } catch (error) {
        console.error("获取 MP3 文件列表失败:", error)
        return NextResponse.json(
            { error: "获取 MP3 文件列表失败" },
            { status: 500 }
        )
    }
}

const isDebug = process.env.IS_DEBUG === "true"
// 生成 mp3 文件
export async function POST() {
    try {

        if (isDebug) {
            const _id = `{debug${+Date.now()}`
            const _filepath = path.join(MP3_DIR, `${_id}.mp3`)
            const _title = '这是一个 debug 测试'
            await submitTask(_title, '内容如下：这是一个 debug 测试', _filepath)
            return NextResponse.json({
                success: true,
                mp3Generating: {
                    id: _id,
                    title: _title,
                },
            })
        }

        const d = new Date()
        const [year, month, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
        const id = `${year}-${month}-${day}`
        const filepath = path.join(MP3_DIR, `${id}.mp3`)
        // 如果文件存在，则返回
        if (fs.existsSync(filepath)) {
            return NextResponse.json({
                success: true,
                message: "文件已存在",
            })
        }

        const news = await fetchReadhubDaily()
        if (!news) {
            return NextResponse.json({
                success: false,
                message: "没有获取到新闻",
            })
        }
        const dayOfWeek = d.getDay() === 0 ? "日" : d.getDay()
        const showNotes = `<speak>
            今天是${year}年${month}月${day}日，星期${dayOfWeek}。以下是最新科技动态。
            <break strength="strong"></break>
            ${news.map((item, index) => `
                <audio src="https://sfs-public.shangdejigou.cn/fe/zttbm/page-turn-effect.mp3"></audio>
                ${index + 1}. ${item.title}
                <break strength="medium"></break>
                ${item.summary}
            `).join('\n')}

        以上就是今天的全部内容，咱们下期见！
        </speak>`


        const title = news[0].title
        await submitTask(title, showNotes, filepath)

        return NextResponse.json({
            success: true,
            mp3Generating: {
                id,
                title,
            },
        })
    } catch (error) {
        console.error("生成文件失败:", error)
        return NextResponse.json(
            { error: "生成文件失败" },
            { status: 500 }
        )
    }
}
