'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorAlert({ title, message, onDismiss, type = 'error' }: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const bgColor = {
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  }[type];

  const borderColor = {
    error: 'border-red-200 dark:border-red-800',
    warning: 'border-yellow-200 dark:border-yellow-800',
    info: 'border-blue-200 dark:border-blue-800',
  }[type];

  const textColor = {
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200',
  }[type];

  const iconColor = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  }[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4 flex items-start gap-3`}>
      <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <h3 className={`font-semibold ${textColor} mb-1`}>{title}</h3>
        <p className={`text-sm ${textColor} opacity-90`}>{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className={`${textColor} hover:opacity-70 flex-shrink-0`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClass} border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}></div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-900 dark:text-white font-medium">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
