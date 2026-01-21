'use client';

import { Clock, TrendingUp, CheckCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface Activity {
  id: string;
  type: 'trade' | 'market_created' | 'market_resolved' | 'claim';
  user: string;
  marketTitle: string;
  amount?: number;
  outcome?: string;
  timestamp: number;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const { t } = useTranslation();
  const displayedActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'market_created':
        return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'market_resolved':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'claim':
        return <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'trade':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{activity.user}</span>
            {' '}bought{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{activity.outcome}</span>
            {' '}for{' '}
            <span className="font-semibold">${activity.amount?.toFixed(2)}</span>
          </>
        );
      case 'market_created':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{activity.user}</span>
            {' '}created market
          </>
        );
      case 'market_resolved':
        return (
          <>
            {t('activity.marketResolved')}{' '}
            <span className="font-semibold text-green-600 dark:text-green-400">{activity.outcome}</span>
            {' '}{t('activity.won')}
          </>
        );
      case 'claim':
        return (
          <>
            <span className="font-semibold text-gray-900 dark:text-white">{activity.user}</span>
            {' '}claimed{' '}
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">${activity.amount?.toFixed(2)}</span>
          </>
        );
    }
  };

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {/* Icon */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
            {getActivityIcon(activity.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {getActivityText(activity)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {activity.marketTitle}
            </p>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
