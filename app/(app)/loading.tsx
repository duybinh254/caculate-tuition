import { Loader2 } from "lucide-react";

/**
 * Next.js tự hiện file này (bọc children bằng Suspense) trong lúc page.tsx của route
 * đang tải dữ liệu trên server. NavBar ở layout.tsx cha không bị ảnh hưởng, vẫn đứng yên.
 */
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 pb-24">
      <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
    </main>
  );
}
