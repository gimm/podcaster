import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// MP3文件存储路径
const MP3_DIR = path.join(process.cwd(), "storage", "mp3")

export async function GET(request, { params }) {
    const { filename }= await params

    // 确保文件名是安全的
    if (!filename || filename.includes("..")) {
        return NextResponse.json(
            { error: "无效的文件名" },
            { status: 400 }
        )
    }

    const filePath = path.join(MP3_DIR, filename)

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        return NextResponse.json(
            { error: `文件不存在${filePath}` },
            { status: 404 }
        )
    }

    // 读取文件
    try {
        const fileBuffer = fs.readFileSync(filePath)

        // 创建并返回响应
        const response = new NextResponse(fileBuffer)

        // 设置适当的头信息
        response.headers.set("Content-Type", "audio/mpeg")
        response.headers.set("Content-Disposition", `inline; filename="${filename}"`)

        return response
    } catch (error) {
        console.error("读取MP3文件失败:", error)
        return NextResponse.json(
            { error: "读取文件失败" },
            { status: 500 }
        )
    }
}