import {
  CHANNELS as SEED_CHANNELS,
  allForumPosts,
  buildMessages,
} from "../../prisma/seed-data";
import type { MockChannel, MockForumPost, MockMessage } from "./types";

/** Channels, messages (the seed-time Shadow draft included), and forum
 *  posts, re-exported from the canonical seed narrative. */
export const CHANNELS: MockChannel[] = SEED_CHANNELS;
export const MESSAGES: MockMessage[] = buildMessages();
export const FORUM_POSTS: MockForumPost[] = allForumPosts();
