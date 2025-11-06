import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export default function Unauthorized() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
                <p>Bạn không có quyền vào khu vực này.</p>
                <Button asChild><Link href="/admin/login">Quay lại</Link></Button>
            </div>
        </div>
    )
}