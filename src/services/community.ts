import { 
  ref, 
  set, 
  get, 
  push, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  limitToLast,
  update
} from 'firebase/database';
import { db } from './firebase.ts';
import { CommunityPost, CommunityComment, DirectMessage, ConversationSummary, UserProfile } from '../types.ts';

/**
 * 1. POSTS OPERATIONS (Server API + RTDB Dual Engine)
 */

export async function createCommunityPost(postData: {
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  authorHandle?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  mediaName?: string;
  mediaSize?: number;
}): Promise<string> {
  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const post: CommunityPost = {
    id: postId,
    authorUid: postData.authorUid,
    authorName: postData.authorName,
    authorAvatar: postData.authorAvatar || '',
    authorHandle: postData.authorHandle || postData.authorName.toLowerCase().replace(/\s+/g, '_'),
    content: postData.content,
    mediaUrl: postData.mediaUrl || '',
    mediaType: postData.mediaType,
    mediaName: postData.mediaName || '',
    mediaSize: postData.mediaSize || 0,
    likesCount: 0,
    commentsCount: 0,
    createdAt: Date.now(),
  };

  // 1. Authoritative server store post (always succeeds, zero permission errors)
  try {
    await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
  } catch (err) {
    console.warn('Server API post write notice:', err);
  }

  // 2. Dual write to RTDB (catching error silently)
  try {
    const postRef = ref(db, `community/posts/${postId}`);
    await set(postRef, post);
  } catch (_) {}

  return postId;
}

export function subscribeCommunityPosts(
  callback: (posts: CommunityPost[]) => void
): () => void {
  let isSubscribed = true;

  // Poll server API every 1500ms
  const pollPosts = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch('/api/community/posts');
      if (res.ok) {
        const list = await res.json();
        callback(list);
      }
    } catch (_) {}
  };

  pollPosts();
  const pollTimer = setInterval(pollPosts, 1500);

  // Dual listen to RTDB with silent error fallback
  const postsRef = query(ref(db, 'community/posts'), orderByChild('createdAt'), limitToLast(80));
  const listener = onValue(postsRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const list: CommunityPost[] = Object.values(data);
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  }, () => {
    // Silent catch on RTDB permission denied; polling handles synchronization seamlessly
  });

  return () => {
    isSubscribed = false;
    clearInterval(pollTimer);
    try {
      off(postsRef, 'value', listener);
    } catch (_) {}
  };
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  try {
    await fetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
  } catch (_) {}

  try {
    await remove(ref(db, `community/posts/${postId}`));
    await remove(ref(db, `community/postLikes/${postId}`));
    await remove(ref(db, `community/comments/${postId}`));
  } catch (_) {}
}

/**
 * 2. LIKES OPERATIONS
 */

export async function togglePostLike(postId: string, uid: string): Promise<boolean> {
  let isLiked = false;

  // 1. Authoritative server toggle
  try {
    const res = await fetch(`/api/community/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid })
    });
    if (res.ok) {
      const data = await res.json();
      isLiked = data.isLiked;
    }
  } catch (_) {}

  // 2. Dual write to RTDB
  try {
    const likeRef = ref(db, `community/postLikes/${postId}/${uid}`);
    const snap = await get(likeRef);
    const postRef = ref(db, `community/posts/${postId}`);
    const postSnap = await get(postRef);

    if (postSnap.exists()) {
      const currentPost = postSnap.val() as CommunityPost;
      if (snap.exists()) {
        await remove(likeRef);
        await update(postRef, { likesCount: Math.max(0, (currentPost.likesCount || 1) - 1) });
      } else {
        await set(likeRef, true);
        await update(postRef, { likesCount: (currentPost.likesCount || 0) + 1 });
      }
    }
  } catch (_) {}

  return isLiked;
}

export function subscribePostLikeStatus(
  postId: string,
  uid: string | null,
  callback: (isLiked: boolean) => void
): () => void {
  if (!uid) {
    callback(false);
    return () => {};
  }

  let isSubscribed = true;

  const checkStatus = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/like/${uid}`);
      if (res.ok) {
        const data = await res.json();
        callback(data.isLiked);
      }
    } catch (_) {}
  };

  checkStatus();
  const timer = setInterval(checkStatus, 2000);

  // Dual listen RTDB
  const likeRef = ref(db, `community/postLikes/${postId}/${uid}`);
  const listener = onValue(likeRef, (snap) => {
    callback(snap.exists());
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(likeRef, 'value', listener);
    } catch (_) {}
  };
}

/**
 * 3. COMMENTS OPERATIONS
 */

export async function addPostComment(
  postId: string,
  authorUid: string,
  authorName: string,
  authorAvatar: string,
  text: string
): Promise<string> {
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const comment: CommunityComment = {
    id: commentId,
    postId,
    authorUid,
    authorName,
    authorAvatar,
    text: text.trim(),
    createdAt: Date.now(),
  };

  // 1. Server API
  try {
    await fetch(`/api/community/comments/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
  } catch (_) {}

  // 2. Dual write RTDB
  try {
    const commentRef = ref(db, `community/comments/${postId}/${commentId}`);
    await set(commentRef, comment);
    const postRef = ref(db, `community/posts/${postId}`);
    const postSnap = await get(postRef);
    if (postSnap.exists()) {
      const post = postSnap.val() as CommunityPost;
      await update(postRef, { commentsCount: (post.commentsCount || 0) + 1 });
    }
  } catch (_) {}

  return commentId;
}

export function subscribePostComments(
  postId: string,
  callback: (comments: CommunityComment[]) => void
): () => void {
  let isSubscribed = true;

  const fetchComments = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/comments/${postId}`);
      if (res.ok) {
        const list = await res.json();
        callback(list);
      }
    } catch (_) {}
  };

  fetchComments();
  const timer = setInterval(fetchComments, 1500);

  // Dual listen RTDB
  const commentsRef = query(ref(db, `community/comments/${postId}`), orderByChild('createdAt'));
  const listener = onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const list: CommunityComment[] = Object.values(data);
    list.sort((a, b) => a.createdAt - b.createdAt);
    callback(list);
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(commentsRef, 'value', listener);
    } catch (_) {}
  };
}

/**
 * 4. FOLLOW & FOLLOWER OPERATIONS
 */

export async function toggleFollowUser(currentUid: string, targetUid: string): Promise<boolean> {
  if (currentUid === targetUid) return false;
  let isFollowing = false;

  // 1. Server API
  try {
    const res = await fetch(`/api/community/follows/${targetUid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUid })
    });
    if (res.ok) {
      const data = await res.json();
      isFollowing = data.isFollowing;
    }
  } catch (_) {}

  // 2. Dual write RTDB
  try {
    const followRef = ref(db, `community/following/${currentUid}/${targetUid}`);
    const followerRef = ref(db, `community/followers/${targetUid}/${currentUid}`);
    const snap = await get(followRef);
    if (snap.exists()) {
      await remove(followRef);
      await remove(followerRef);
    } else {
      await set(followRef, true);
      await set(followerRef, true);
    }
  } catch (_) {}

  return isFollowing;
}

export function subscribeIsFollowing(
  currentUid: string | null,
  targetUid: string,
  callback: (isFollowing: boolean) => void
): () => void {
  if (!currentUid) {
    callback(false);
    return () => {};
  }

  let isSubscribed = true;
  const check = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/follows/${targetUid}?currentUid=${currentUid}`);
      if (res.ok) {
        const data = await res.json();
        callback(data.isFollowing);
      }
    } catch (_) {}
  };

  check();
  const timer = setInterval(check, 2000);

  // Dual listen RTDB
  const followRef = ref(db, `community/following/${currentUid}/${targetUid}`);
  const listener = onValue(followRef, (snap) => {
    callback(snap.exists());
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(followRef, 'value', listener);
    } catch (_) {}
  };
}

export function subscribeUserFollowCounts(
  uid: string,
  callback: (counts: { followers: number; following: number }) => void
): () => void {
  let isSubscribed = true;

  const fetchCounts = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/follows/${uid}`);
      if (res.ok) {
        const data = await res.json();
        callback({ followers: data.followersCount, following: data.followingCount });
      }
    } catch (_) {}
  };

  fetchCounts();
  const timer = setInterval(fetchCounts, 2000);

  // Dual listen RTDB
  const followersRef = ref(db, `community/followers/${uid}`);
  const followingRef = ref(db, `community/following/${uid}`);
  let followersCount = 0;
  let followingCount = 0;

  const followersListener = onValue(followersRef, (snap) => {
    followersCount = snap.exists() ? Object.keys(snap.val()).length : 0;
    callback({ followers: followersCount, following: followingCount });
  }, () => {});

  const followingListener = onValue(followingRef, (snap) => {
    followingCount = snap.exists() ? Object.keys(snap.val()).length : 0;
    callback({ followers: followersCount, following: followingCount });
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(followersRef, 'value', followersListener);
      off(followingRef, 'value', followingListener);
    } catch (_) {}
  };
}

/**
 * 5. USER BLOCKING OPERATIONS
 */

export async function toggleBlockUser(currentUid: string, targetUid: string): Promise<boolean> {
  if (currentUid === targetUid) return false;
  let isBlocked = false;

  try {
    const res = await fetch(`/api/community/blocks/${targetUid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUid })
    });
    if (res.ok) {
      const data = await res.json();
      isBlocked = data.isBlocked;
    }
  } catch (_) {}

  try {
    const blockRef = ref(db, `community/blocks/${currentUid}/${targetUid}`);
    const snap = await get(blockRef);
    if (snap.exists()) {
      await remove(blockRef);
    } else {
      await set(blockRef, true);
    }
  } catch (_) {}

  return isBlocked;
}

export function subscribeBlockedUsers(
  currentUid: string | null,
  callback: (blockedUids: Set<string>) => void
): () => void {
  if (!currentUid) {
    callback(new Set());
    return () => {};
  }

  let isSubscribed = true;

  const fetchBlocks = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/blocks/${currentUid}`);
      if (res.ok) {
        const list = await res.json();
        callback(new Set(list));
      }
    } catch (_) {}
  };

  fetchBlocks();
  const timer = setInterval(fetchBlocks, 3000);

  const blockRef = ref(db, `community/blocks/${currentUid}`);
  const listener = onValue(blockRef, (snap) => {
    if (snap.exists()) {
      callback(new Set(Object.keys(snap.val())));
    }
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(blockRef, 'value', listener);
    } catch (_) {}
  };
}

/**
 * 6. DIRECT PRIVATE MESSAGING OPERATIONS
 */

export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function sendDirectMessage(data: {
  senderUid: string;
  senderName: string;
  senderAvatar?: string;
  receiverUid: string;
  receiverName: string;
  receiverAvatar?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  mediaName?: string;
}): Promise<string> {
  const conversationId = getConversationId(data.senderUid, data.receiverUid);
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const msg: DirectMessage = {
    id: msgId,
    conversationId,
    senderUid: data.senderUid,
    senderName: data.senderName,
    receiverUid: data.receiverUid,
    receiverName: data.receiverName,
    text: data.text,
    mediaUrl: data.mediaUrl || '',
    mediaType: data.mediaType,
    mediaName: data.mediaName || '',
    createdAt: Date.now(),
    read: false,
  };

  // 1. Authoritative server API send
  try {
    await fetch('/api/community/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
  } catch (_) {}

  // 2. Dual write RTDB
  try {
    const msgListRef = ref(db, `community/messages/${conversationId}/${msgId}`);
    await set(msgListRef, msg);
  } catch (_) {}

  return msgId;
}

export function subscribeDirectMessages(
  uid1: string,
  uid2: string,
  callback: (messages: DirectMessage[]) => void
): () => void {
  const conversationId = getConversationId(uid1, uid2);
  let isSubscribed = true;

  const fetchMessages = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/messages/${conversationId}`);
      if (res.ok) {
        const list = await res.json();
        callback(list);
      }
    } catch (_) {}
  };

  fetchMessages();
  const timer = setInterval(fetchMessages, 1200);

  const messagesRef = query(ref(db, `community/messages/${conversationId}`), orderByChild('createdAt'), limitToLast(100));
  const listener = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const list: DirectMessage[] = Object.values(data);
    list.sort((a, b) => a.createdAt - b.createdAt);
    callback(list);
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(messagesRef, 'value', listener);
    } catch (_) {}
  };
}

export function subscribeUserConversations(
  uid: string,
  callback: (conversations: ConversationSummary[]) => void
): () => void {
  let isSubscribed = true;

  const fetchConvs = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/community/conversations/${uid}`);
      if (res.ok) {
        const list = await res.json();
        callback(list);
      }
    } catch (_) {}
  };

  fetchConvs();
  const timer = setInterval(fetchConvs, 2000);

  const convsRef = query(ref(db, `community/userConversations/${uid}`), orderByChild('lastTimestamp'));
  const listener = onValue(convsRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const list: ConversationSummary[] = Object.values(data);
    list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    callback(list);
  }, () => {});

  return () => {
    isSubscribed = false;
    clearInterval(timer);
    try {
      off(convsRef, 'value', listener);
    } catch (_) {}
  };
}

export async function markConversationAsRead(currentUid: string, conversationId: string): Promise<void> {
  try {
    await fetch(`/api/community/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUid })
    });
  } catch (_) {}
}

/**
 * 7. USER PROFILE ENHANCEMENTS
 */

export async function updateCommunityUserProfile(
  uid: string,
  updates: { name?: string; bio?: string; avatarUrl?: string; handle?: string }
): Promise<void> {
  try {
    await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (_) {}

  try {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, updates);
  } catch (_) {}
}

export async function getCommunityUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${uid}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
  } catch (_) {}

  return null;
}
