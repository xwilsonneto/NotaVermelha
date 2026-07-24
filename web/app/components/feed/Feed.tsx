// components/feed/Feed.tsx
'use client';

import { useAuthStore } from '@/app/store/authStore';
import FeedSection      from './FeedSection';

export default function Feed() {
  const user          = useAuthStore(state => state.user);
  const currentUserId = user?._id ?? '';

  return (
    <div className="max-w-2xl w-full mx-auto">
      <FeedSection currentUserId={currentUserId} />
    </div>
  );
}
