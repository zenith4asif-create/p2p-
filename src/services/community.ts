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
 * 1. POSTS OPERATIONS
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
  const postsRef = ref(db, 'community/posts');
  const newPostRef = push(postsRef);
  const postId = newPostRef.key!;

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

  await set(newPostRef, post);
  return postId;
}

export function subscribeCommunityPosts(
  callback: (posts: CommunityPost[]) => void
): () => void {
  const postsRef = query(ref(db, 'community/posts'), orderByChild('createdAt'), limitToLast(80));

  const listener = onValue(postsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const list: CommunityPost[] = Object.values(data);
    // Sort descending by createdAt
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  }, (err) => {
    console.error('Error subscribing to community posts:', err);
    callback([]);
  });

  return () => off(postsRef, 'value', listener);
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  await remove(ref(db, `community/posts/${postId}`));
  await remove(ref(db, `community/postLikes/${postId}`));
  await remove(ref(db, `community/comments/${postId}`));
}

/**
 * 2. LIKES OPERATIONS
 */

export async function togglePostLike(postId: string, uid: string): Promise<boolean> {
  const likeRef = ref(db, `community/postLikes/${postId}/${uid}`);
  const snap = await get(likeRef);
  const postRef = ref(db, `community/posts/${postId}`);
  const postSnap = await get(postRef);

  if (!postSnap.exists()) return false;
  const currentPost = postSnap.val() as CommunityPost;

  if (snap.exists()) {
    // Unlike
    await remove(likeRef);
    const newCount = Math.max(0, (currentPost.likesCount || 1) - 1);
    await update(postRef, { likesCount: newCount });
    return false;
  } else {
    // Like
    await set(likeRef, true);
    const newCount = (currentPost.likesCount || 0) + 1;
    await update(postRef, { likesCount: newCount });
    return true;
  }
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
  const likeRef = ref(db, `community/postLikes/${postId}/${uid}`);
  const listener = onValue(likeRef, (snap) => {
    callback(snap.exists());
  });
  return () => off(likeRef, 'value', listener);
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
  const commentsRef = ref(db, `community/comments/${postId}`);
  const newCommentRef = push(commentsRef);
  const commentId = newCommentRef.key!;

  const comment: CommunityComment = {
    id: commentId,
    postId,
    authorUid,
    authorName,
    authorAvatar,
    text: text.trim(),
    createdAt: Date.now(),
  };

  await set(newCommentRef, comment);

  // Increment comments count on post
  const postRef = ref(db, `community/posts/${postId}`);
  const postSnap = await get(postRef);
  if (postSnap.exists()) {
    const post = postSnap.val() as CommunityPost;
    await update(postRef, { commentsCount: (post.commentsCount || 0) + 1 });
  }

  return commentId;
}

export function subscribePostComments(
  postId: string,
  callback: (comments: CommunityComment[]) => void
): () => void {
  const commentsRef = query(ref(db, `community/comments/${postId}`), orderByChild('createdAt'));
  const listener = onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const list: CommunityComment[] = Object.values(data);
    list.sort((a, b) => a.createdAt - b.createdAt);
    callback(list);
  });
  return () => off(commentsRef, 'value', listener);
}

/**
 * 4. FOLLOW & FOLLOWER OPERATIONS
 */

export async function toggleFollowUser(currentUid: string, targetUid: string): Promise<boolean> {
  if (currentUid === targetUid) return false;

  const followRef = ref(db, `community/following/${currentUid}/${targetUid}`);
  const followerRef = ref(db, `community/followers/${targetUid}/${currentUid}`);
  const snap = await get(followRef);

  if (snap.exists()) {
    // Unfollow
    await remove(followRef);
    await remove(followerRef);
    return false;
  } else {
    // Follow
    await set(followRef, true);
    await set(followerRef, true);
    return true;
  }
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
  const followRef = ref(db, `community/following/${currentUid}/${targetUid}`);
  const listener = onValue(followRef, (snap) => {
    callback(snap.exists());
  });
  return () => off(followRef, 'value', listener);
}

export function subscribeUserFollowCounts(
  uid: string,
  callback: (counts: { followers: number; following: number }) => void
): () => void {
  const followersRef = ref(db, `community/followers/${uid}`);
  const followingRef = ref(db, `community/following/${uid}`);

  let followersCount = 0;
  let followingCount = 0;

  const followersListener = onValue(followersRef, (snap) => {
    followersCount = snap.exists() ? Object.keys(snap.val()).length : 0;
    callback({ followers: followersCount, following: followingCount });
  });

  const followingListener = onValue(followingRef, (snap) => {
    followingCount = snap.exists() ? Object.keys(snap.val()).length : 0;
    callback({ followers: followersCount, following: followingCount });
  });

  return () => {
    off(followersRef, 'value', followersListener);
    off(followingRef, 'value', followingListener);
  };
}

/**
 * 5. USER BLOCKING OPERATIONS
 */

export async function toggleBlockUser(currentUid: string, targetUid: string): Promise<boolean> {
  if (currentUid === targetUid) return false;

  const blockRef = ref(db, `community/blocks/${currentUid}/${targetUid}`);
  const snap = await get(blockRef);

  if (snap.exists()) {
    // Unblock
    await remove(blockRef);
    return false;
  } else {
    // Block
    await set(blockRef, true);
    // Auto unfollow both ways on block
    await remove(ref(db, `community/following/${currentUid}/${targetUid}`));
    await remove(ref(db, `community/followers/${targetUid}/${currentUid}`));
    await remove(ref(db, `community/following/${targetUid}/${currentUid}`));
    await remove(ref(db, `community/followers/${currentUid}/${targetUid}`));
    return true;
  }
}

export function subscribeBlockedUsers(
  currentUid: string | null,
  callback: (blockedUids: Set<string>) => void
): () => void {
  if (!currentUid) {
    callback(new Set());
    return () => {};
  }

  const blockRef = ref(db, `community/blocks/${currentUid}`);
  const listener = onValue(blockRef, (snap) => {
    if (!snap.exists()) {
      callback(new Set());
      return;
    }
    const val = snap.val();
    callback(new Set(Object.keys(val)));
  });

  return () => off(blockRef, 'value', listener);
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
  const msgListRef = ref(db, `community/messages/${conversationId}`);
  const newMsgRef = push(msgListRef);
  const msgId = newMsgRef.key!;

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

  await set(newMsgRef, msg);

  // Update conversation summary for sender
  const senderConvRef = ref(db, `community/userConversations/${data.senderUid}/${conversationId}`);
  await set(senderConvRef, {
    conversationId,
    otherUid: data.receiverUid,
    otherName: data.receiverName,
    otherAvatar: data.receiverAvatar || '',
    lastMessage: data.text || (data.mediaType === 'video' ? '🎥 Video' : '📷 Image'),
    lastTimestamp: Date.now(),
    unreadCount: 0,
  });

  // Update conversation summary for receiver
  const receiverConvRef = ref(db, `community/userConversations/${data.receiverUid}/${conversationId}`);
  const prevRecSnap = await get(receiverConvRef);
  const prevUnread = prevRecSnap.exists() ? (prevRecSnap.val().unreadCount || 0) : 0;

  await set(receiverConvRef, {
    conversationId,
    otherUid: data.senderUid,
    otherName: data.senderName,
    otherAvatar: data.senderAvatar || '',
    lastMessage: data.text || (data.mediaType === 'video' ? '🎥 Video' : '📷 Image'),
    lastTimestamp: Date.now(),
    unreadCount: prevUnread + 1,
  });

  return msgId;
}

export function subscribeDirectMessages(
  uid1: string,
  uid2: string,
  callback: (messages: DirectMessage[]) => void
): () => void {
  const conversationId = getConversationId(uid1, uid2);
  const messagesRef = query(ref(db, `community/messages/${conversationId}`), orderByChild('createdAt'), limitToLast(100));

  const listener = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const list: DirectMessage[] = Object.values(data);
    list.sort((a, b) => a.createdAt - b.createdAt);
    callback(list);
  });

  return () => off(messagesRef, 'value', listener);
}

export function subscribeUserConversations(
  uid: string,
  callback: (conversations: ConversationSummary[]) => void
): () => void {
  const convsRef = query(ref(db, `community/userConversations/${uid}`), orderByChild('lastTimestamp'));

  const listener = onValue(convsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const list: ConversationSummary[] = Object.values(data);
    list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    callback(list);
  });

  return () => off(convsRef, 'value', listener);
}

export async function markConversationAsRead(currentUid: string, conversationId: string): Promise<void> {
  const convRef = ref(db, `community/userConversations/${currentUid}/${conversationId}`);
  const snap = await get(convRef);
  if (snap.exists()) {
    await update(convRef, { unreadCount: 0 });
  }
}

/**
 * 7. USER PROFILE ENHANCEMENTS
 */

export async function updateCommunityUserProfile(
  uid: string,
  updates: { name?: string; bio?: string; avatarUrl?: string; handle?: string }
): Promise<void> {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, updates);
}

export async function getCommunityUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}
