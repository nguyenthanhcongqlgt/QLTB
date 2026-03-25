import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({ where: { key: "LOGO" } });
        if (!setting || !setting.value) {
            return new Response(null, { status: 404 });
        }

        let base64Data = setting.value;
        let contentType = "image/png";

        if (setting.value.startsWith("data:")) {
            const matches = setting.value.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                contentType = matches[1];
                base64Data = matches[2];
            }
        }

        const buffer = Buffer.from(base64Data, "base64");
        return new Response(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=60, must-revalidate",
            }
        });
    } catch (e: any) {
        return new Response(null, { status: 500 });
    }
}
