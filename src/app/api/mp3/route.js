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
        const mp3Files = files
            .filter(file => file.endsWith(".mp3"))
            .map(file => {
                const stats = fs.statSync(path.join(MP3_DIR, file))
                return {
                    id: file.replace(".mp3", ""),
                    name: file.replace(".mp3", "").replace(/-/g, " "),
                    path: `/mp3/${file}`,
                    size: stats.size,
                    lastModified: stats.mtime
                }
            })
            .sort((a, b) => b.lastModified - a.lastModified)
            .slice(0, 3)

        return NextResponse.json({ mp3Files })
    } catch (error) {
        console.error("获取 MP3 文件列表失败:", error)
        return NextResponse.json(
            { error: "获取 MP3 文件列表失败" },
            { status: 500 }
        )
    }
}

// 上传 MP3 文件
// export async function POST(request) {
//     try {
//         const formData = await request.formData()
//         const file = formData.get("mp3File")

//         if (!file || !file.name.endsWith(".mp3")) {
//             return NextResponse.json(
//                 { error: "请上传有效的 MP3 文件" },
//                 { status: 400 }
//             )
//         }

//         // 保留原始文件名，但确保唯一性
//         const originalName = file.name.replace(/\s+/g, '_')
//         const fileName = `${Math.random().toString(36).substring(2, 15)}-${originalName}`
//         const filePath = path.join(MP3_DIR, fileName)

//         // 将文件写入服务器
//         const buffer = Buffer.from(await file.arrayBuffer())
//         await writeFile(filePath, buffer)

//         return NextResponse.json({
//             success: true,
//             fileName
//         })
//     } catch (error) {
//         console.error("上传 MP3 文件失败:", error)
//         return NextResponse.json(
//             { error: "上传 MP3 文件失败" },
//             { status: 500 }
//         )
//     }
// }

// 生成 mp3 文件
export async function POST(request) {
    try {
        const news = await fetchReadhubDaily()
        console.log(news)
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
        const fileName = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}_${d.getHours()}${d.getMinutes()}${d.getSeconds()}.mp3`
        const outputFileName = path.join(MP3_DIR, fileName)
        await submitTask(showNotes, outputFileName)
        return NextResponse.json({
            success: true,
            outputFileName
        })
    } catch (error) {
        console.error("生成文件失败:", error)
        return NextResponse.json(
            { error: "生成文件失败" },
            { status: 500 }
        )
    }
}
