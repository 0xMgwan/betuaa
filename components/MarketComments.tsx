'use client';

import { useState } from 'react';
import { MessageCircle, Send, ThumbsUp, Reply, MoreVertical, Flag } from 'lucide-react';
import { useAccount } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  author: string;
  authorUsername?: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  isLiked?: boolean;
}

interface MarketCommentsProps {
  marketId: number;
  marketTitle: string;
}

export default function MarketComments({ marketId, marketTitle }: MarketCommentsProps) {
  const { address } = useAccount();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: '0x1234...5678',
      authorUsername: 'CryptoTrader',
      content: 'This market looks very promising! The fundamentals are strong.',
      timestamp: new Date(Date.now() - 3600000),
      likes: 12,
      replies: [
        {
          id: '1-1',
          author: '0x8765...4321',
          authorUsername: 'MarketWatcher',
          content: 'Agreed! I just bought some Yes shares.',
          timestamp: new Date(Date.now() - 1800000),
          likes: 5,
          replies: [],
        }
      ],
    },
    {
      id: '2',
      author: '0xabcd...efgh',
      authorUsername: 'Analyst',
      content: 'Not so sure about this one. The timeline seems too optimistic.',
      timestamp: new Date(Date.now() - 7200000),
      likes: 8,
      replies: [],
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handlePostComment = () => {
    if (!newComment.trim() || !address) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: address,
      authorUsername: 'You',
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      replies: [],
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handlePostReply = (parentId: string) => {
    if (!replyContent.trim() || !address) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      author: address,
      authorUsername: 'You',
      content: replyContent,
      timestamp: new Date(),
      likes: 0,
      replies: [],
    };

    setComments(comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...comment.replies, reply] };
      }
      return comment;
    }));

    setReplyContent('');
    setReplyingTo(null);
  };

  const handleLike = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return {
        ...comment,
        replies: comment.replies.map(reply => {
          if (reply.id === commentId) {
            return {
              ...reply,
              likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
              isLiked: !reply.isLiked,
            };
          }
          return reply;
        }),
      };
    }));
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {comment.authorUsername?.[0] || comment.author.slice(2, 4).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.authorUsername || `${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  comment.isLiked
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-current' : ''}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handlePostReply(comment.id)}
                />
                <button
                  onClick={() => handlePostReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* New Comment Input */}
      {address ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this market..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your wallet to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
