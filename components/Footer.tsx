"use client";

import Link from "next/link";
import { Mail, Twitter, Instagram, Github, MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gradient-to-br from-red-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-600 dark:text-gray-400 py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright and Links - Left on desktop, top on mobile */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm order-2 md:order-1">
            <span className="font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
              2026 Stretch. {t('footer.allRights')}.
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link href="/privacy" className="relative hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium">
              {t('footer.privacy')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 hover:w-full"></span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link href="/terms" className="relative hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium">
              {t('footer.terms')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 hover:w-full"></span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link href="/learn" className="relative hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium">
              {t('footer.learn')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 hover:w-full"></span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link href="/careers" className="relative hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium">
              {t('footer.careers')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 hover:w-full"></span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link href="/press" className="relative hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium">
              {t('footer.press')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 hover:w-full"></span>
            </Link>
          </div>

          {/* Social Icons - Right on desktop, bottom on mobile */}
          <div className="flex items-center gap-3 order-3">
            <a
              href="mailto:hello@stretch.app"
              className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 group"
              aria-label="Email"
            >
              <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </a>
            <a
              href="https://twitter.com/stretchapp"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-sky-100 hover:to-sky-200 dark:hover:from-sky-900/30 dark:hover:to-sky-800/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-sky-500/20 group"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            </a>
            <a
              href="https://instagram.com/stretchapp"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-900/30 dark:hover:to-pink-800/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/20 group"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
            </a>
            <a
              href="https://github.com/stretchapp"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20 group"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </a>
            <a
              href="https://discord.gg/stretch"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20 group"
              aria-label="Discord"
            >
              <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
