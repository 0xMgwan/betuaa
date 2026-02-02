"use client";

import { Home, Search, TrendingUp, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

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
      href: "/",
      active: false,
      onClick: () => {
        // If not on home page, redirect to home first
        if (pathname !== "/") {
          router.push("/");
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
              const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
              searchInput?.focus();
            }, 300);
          }, 100);
        } else {
          // Already on home page, just scroll and focus
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            searchInput?.focus();
          }, 300);
        }
      },
    },
    {
      name: "Trending",
      icon: TrendingUp,
      href: "/",
      active: false,
      onClick: () => {
        // If not on home page, redirect to home first
        if (pathname !== "/") {
          router.push("/?category=trending");
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
              const categoryButton = document.querySelector('[data-category="trending"]') as HTMLButtonElement;
              categoryButton?.click();
            }, 300);
          }, 100);
        } else {
          // Already on home page, just click trending
          const categoryButton = document.querySelector('[data-category="trending"]') as HTMLButtonElement;
          if (categoryButton) {
            categoryButton.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      },
    },
    {
      name: "Create",
      icon: Plus,
      href: "#",
      active: false,
      onClick: () => {
        // Trigger the navbar's create market button
        const navbarCreateButtons = document.querySelectorAll('button');
        const createButton = Array.from(navbarCreateButtons).find(btn => 
          btn.textContent?.includes('Create') || btn.querySelector('.lucide-plus')
        );
        if (createButton) {
          createButton.click();
        } else {
          // Fallback: navigate to create page if button not found
          router.push('/create');
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_16px_rgba(0,0,0,0.4)] safe-area-pb">
      <div className="grid grid-cols-5 h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          if (item.onClick) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 relative"
              >
                <div className={`relative flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 shadow-lg shadow-blue-500/40 dark:shadow-blue-500/50 scale-105" 
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? "text-white drop-shadow-lg" 
                      : "text-gray-700 dark:text-gray-300"
                  }`} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                  )}
                </div>
                <span className={`text-[10px] font-bold transition-all duration-300 ${
                  isActive 
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400"
                }`}>
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 relative"
            >
              <div className={`relative flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 shadow-lg shadow-blue-500/40 dark:shadow-blue-500/50 scale-105" 
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive 
                    ? "text-white drop-shadow-lg" 
                    : "text-gray-700 dark:text-gray-300"
                }`} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                )}
              </div>
              <span className={`text-[10px] font-bold transition-all duration-300 ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
