"use client";

import Link from "next/link";
import { Mail, Twitter, Instagram, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright and Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
            <span>BetUAA Inc. © 2026</span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Terms of Use
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/learn" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Learn
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/careers" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Careers
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/press" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Press
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="mailto:hello@betuaa.com"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/betuaa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/betuaa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/betuaa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://discord.gg/betuaa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
