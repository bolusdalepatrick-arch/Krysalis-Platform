// One-shot assembly helper for M1: splices the authored seed content
// (workflow output JSON) into prisma/seed-data.ts as typed constants.
// Safe to delete after the splice; kept out of the app build.
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath] = process.argv;
const raw = readFileSync(inputPath, "utf8");

// The task output file holds the workflow's JSON return value, possibly
// wrapped in notification text. Extract the outermost JSON object.
const start = raw.indexOf("{");
const end = raw.lastIndexOf("}");
const parsed = JSON.parse(raw.slice(start, end + 1));
const data = parsed.result ?? parsed;

const required = ["tsLessons", "bfLessons", "jobDescriptions", "messages", "forumVault"];
for (const key of required) {
  if (!data[key]) throw new Error(`Workflow result is missing ${key}`);
}

const tsq = (s) => JSON.stringify(s);

const lessonBodies = [...data.tsLessons, ...data.bfLessons]
  .map((l) => `  ${tsq(l.id)}: ${tsq(l.body)},`)
  .join("\n");

const jobDescriptions = data.jobDescriptions
  .map((j) => `  ${tsq(j.id)}: ${tsq(j.description)},`)
  .join("\n");

const messages = data.messages
  .map(
    (m) =>
      `  { channelId: ${tsq(m.channelId)}, senderId: ${tsq(m.senderId)}, at: ${tsq(m.at)}, body: ${tsq(m.body)} },`,
  )
  .join("\n");

const posts = data.forumVault.posts
  .map((p) => {
    const dept = p.departmentId ? ` departmentId: ${tsq(p.departmentId)},` : "";
    const replies = p.replies
      .map(
        (r) =>
          `      { id: ${tsq(r.id)}, authorId: ${tsq(r.authorId)}, body: ${tsq(r.body)}, at: ${tsq(r.at)} },`,
      )
      .join("\n");
    return `  {\n    id: ${tsq(p.id)},\n    authorId: ${tsq(p.authorId)},${dept}\n    title: ${tsq(p.title)},\n    body: ${tsq(p.body)},\n    at: ${tsq(p.at)},\n    replies: [\n${replies}\n    ],\n  },`;
  })
  .join("\n");

const assets = data.forumVault.assets
  .map((a) => {
    const parts = [
      `id: ${tsq(a.id)}`,
      `title: ${tsq(a.title)}`,
      `fileType: ${tsq(a.fileType)}`,
      `fileUrl: ${tsq(a.fileUrl)}`,
    ];
    if (a.sizeKb) parts.push(`sizeKb: ${a.sizeKb}`);
    parts.push(`isSharedSocial: ${a.isSharedSocial}`);
    parts.push(`uploadedById: ${tsq(a.uploadedById)}`);
    if (a.jobId) parts.push(`jobId: ${tsq(a.jobId)}`);
    parts.push(`createdAt: ${tsq(a.createdAt)}`);
    return `  { ${parts.join(", ")} },`;
  })
  .join("\n");

const file = "prisma/seed-data.ts";
let src = readFileSync(file, "utf8");

function replaceBlock(marker, replacement) {
  if (!src.includes(marker)) throw new Error(`Marker not found: ${marker}`);
  src = src.replace(marker, replacement);
}

replaceBlock(
  "export const EXTRA_LESSON_BODIES: Record<string, string> = {};",
  `export const EXTRA_LESSON_BODIES: Record<string, string> = {\n${lessonBodies}\n};`,
);
replaceBlock(
  "export const EXTRA_JOB_DESCRIPTIONS: Record<string, string> = {};",
  `export const EXTRA_JOB_DESCRIPTIONS: Record<string, string> = {\n${jobDescriptions}\n};`,
);
replaceBlock(
  "export const EXTRA_MESSAGES: RawMessage[] = [];",
  `export const EXTRA_MESSAGES: RawMessage[] = [\n${messages}\n];`,
);
replaceBlock(
  "export const EXTRA_FORUM_POSTS: MockForumPost[] = [];",
  `export const EXTRA_FORUM_POSTS: MockForumPost[] = [\n${posts}\n];`,
);
replaceBlock(
  "export const EXTRA_VAULT_ASSETS: MockVaultAsset[] = [];",
  `export const EXTRA_VAULT_ASSETS: MockVaultAsset[] = [\n${assets}\n];`,
);

writeFileSync(file, src);
console.log(
  `Spliced: ${data.tsLessons.length + data.bfLessons.length} lesson bodies, ` +
    `${data.jobDescriptions.length} job descriptions, ${data.messages.length} messages, ` +
    `${data.forumVault.posts.length} forum posts, ${data.forumVault.assets.length} assets.`,
);
