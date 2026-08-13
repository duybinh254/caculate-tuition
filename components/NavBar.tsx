"use client";

import { BookOpen, CalendarCheck, Home, LogOut, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Tổng quan", icon: Home, ready: true },
  { href: "/classes", label: "Lớp học", icon: BookOpen, ready: true },
  { href: "/students", label: "Học sinh", icon: Users, ready: true },
  { href: "/attendance", label: "Điểm danh", icon: CalendarCheck, ready: true },
  { href: "/billing", label: "Học phí", icon: Wallet, ready: true },
];

export default function NavBar({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        <button
          onClick={handleLogout}
          aria-label="Đăng xuất"
          className="rounded-lg p-2 text-gray-400 active:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md">
          {LINKS.filter((l) => l.ready).map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
