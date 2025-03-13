import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { fetchReadhubDaily } from '@/app/util/readhub.daily'
import { submitTask } from '@/app/util/seedtts'


// MP3 文件存储路径
const MP3_DIR = path.join(process.cwd(), "public", "mp3")

// 确保 MP3 目录存在
if (!fs.existsSync(MP3_DIR)) {
    fs.mkdirSync(MP3_DIR, { recursive: true })
}


// 获取 MP3 文件列表
export async function GET() {
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
                    path: `/mp3/${file}`,
                    size: stats.size,
                    lastModified: stats.mtime,
                }
            })
            .sort((a, b) => b.lastModified - a.lastModified)
            .slice(0, 5)

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


// 生成 mp3 文件
export async function POST() {
    try {
        const news = await fetchReadhubDaily()
        const d = new Date()
        const showNotes = `<speak>
            今天是${d.getFullYear()}年${d.getMonth()}月${d.getDate()}日，星期${d.getDay()}。以下是最新科技动态。
            <break strength="strong"></break>
            ${news.map((item, index) => `
                <audio src="https://sfs-public.shangdejigou.cn/fe/zttbm/page-turn-effect.mp3"></audio>
                ${index + 1}. ${item.title}
                <break strength="medium"></break>
                ${item.summary}
            `).join('\n')}

        以上就是今天的全部内容，咱们下期见！
        </speak>`


        const id = String(new Date().getTime())
        const filepath = path.join(MP3_DIR, `${id}.mp3`)
        const title = news[0].title
        await submitTask(showNotes, filepath)

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
