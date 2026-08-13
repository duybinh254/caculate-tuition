"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Tổng quan", ready: true },
  { href: "/classes", label: "Lớp học", ready: true },
  { href: "/students", label: "Học sinh", ready: true },
  { href: "/attendance", label: "Điểm danh", ready: true },
  { href: "/billing", label: "Học phí", ready: false },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {LINKS.map((link) =>
          link.ready ? (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-semibold text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }
            >
              {link.label}
            </Link>
          ) : (
            <span key={link.href} className="text-gray-300" title="Chưa xây dựng">
              {link.label}
            </span>
          )
        )}
      </div>
      <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
        Đăng xuất
      </button>
    </nav>
  );
}
