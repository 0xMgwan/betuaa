"use client";

import { Home, Search, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Explore",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      name: "Search",
      icon: Search,
      href: "#search",
      active: false,
      onClick: () => {
        // Scroll to top and focus search
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          searchInput?.focus();
        }, 300);
      },
    },
    {
      name: "Trending",
      icon: TrendingUp,
      href: "#trending",
      active: false,
      onClick: () => {
        // Scroll to trending section or filter by trending
        const categoryButton = document.querySelector('[data-category="trending"]') as HTMLButtonElement;
        if (categoryButton) {
          categoryButton.click();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
    },
    {
      name: "Portfolio",
      icon: Wallet,
      href: "/portfolio",
      active: pathname === "/portfolio",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 active:text-blue-600 dark:active:text-blue-400"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "fill-current" : ""}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 active:text-blue-600 dark:active:text-blue-400"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
