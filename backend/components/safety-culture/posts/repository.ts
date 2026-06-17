import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { awardPoints } from "@backend/components/points/repository";

type PostRow = RowDataPacket & {
  id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  status: string;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  like_count: number | string;
  comment_count: number | string;
  has_liked: 0 | 1 | boolean;
};

type CommentRow = RowDataPacket & {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  created_at: Date | string;
};

function mapPost(row: PostRow) {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    authorName: row.author_name || "Unknown user",
    content: row.content,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0),
    hasLiked: Boolean(row.has_liked),
  };
}

function mapComment(row: CommentRow) {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorId: String(row.author_id),
    authorName: row.author_name || "Unknown user",
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const SELECT_POSTS_SQL = `
  SELECT
    p.id,
    p.author_id,
    u.name_th AS author_name,
    p.content,
    p.status,
    p.published_at,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT r.user_id) AS like_count,
    COUNT(DISTINCT c.id) AS comment_count,
    MAX(CASE WHEN r.user_id = :viewerId THEN 1 ELSE 0 END) AS has_liked
  FROM posts p
  LEFT JOIN users u ON u.id = p.author_id
  LEFT JOIN reactions r ON r.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
`;

export async function listPosts(options: { viewerId: string; limit?: number; cursor?: string | null; status?: string | null }) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const where = ["p.deleted_at IS NULL"];
  const params: Record<string, unknown> = {
    viewerId: options.viewerId,
    limit,
  };

  if (options.cursor) {
    where.push("p.id < :cursor");
    params.cursor = options.cursor;
  }
  if (options.status) {
    where.push("p.status = :status");
    params.status = options.status;
  } else {
    where.push("p.status = 'PUBLISHED'");
  }

  const rows = await queryRows<PostRow>(
    `
      ${SELECT_POSTS_SQL}
      WHERE ${where.join(" AND ")}
      GROUP BY p.id, p.author_id, u.name_th, p.content, p.status, p.published_at, p.created_at, p.updated_at
      ORDER BY p.id DESC
      LIMIT :limit
    `,
    params,
  );

  return {
    items: rows.map(mapPost),
    nextCursor: rows.length === limit ? String(rows[rows.length - 1].id) : null,
  };
}

export async function getPost(id: string, viewerId: string) {
  const rows = await queryRows<PostRow>(
    `
      ${SELECT_POSTS_SQL}
      WHERE p.id = :id AND p.deleted_at IS NULL
      GROUP BY p.id, p.author_id, u.name_th, p.content, p.status, p.published_at, p.created_at, p.updated_at
      LIMIT 1
    `,
    { id, viewerId },
  );
  return rows[0] ? mapPost(rows[0]) : null;
}

export async function createPost(input: { authorId: string; content: string; status?: string }) {
  const content = input.content.trim();
  if (!content) throw new Error("content_required");

  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO posts (author_id, content, status, published_at)
        VALUES (:authorId, :content, :status, CASE WHEN :status = 'PUBLISHED' THEN UTC_TIMESTAMP(3) ELSE NULL END)
      `,
      {
        authorId: input.authorId,
        content,
        status: input.status || "PUBLISHED",
      },
    );
    return String(result.insertId);
  });

  await awardPoints({
    userId: input.authorId,
    action: "safetyPostApproved",
    sourceType: "POST",
    sourceId: id,
    idempotencyKey: `post:${id}:approved`,
    description: "สร้าง Safety Post ที่อนุมัติ",
  }).catch(() => null);

  return getPost(id, input.authorId);
}

export async function updatePost(id: string, userId: string, input: { content?: string; status?: string }) {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        UPDATE posts
        SET
          content = COALESCE(:content, content),
          status = COALESCE(:status, status),
          published_at = CASE
            WHEN :status = 'PUBLISHED' AND published_at IS NULL THEN UTC_TIMESTAMP(3)
            ELSE published_at
          END
        WHERE id = :id AND author_id = :userId AND deleted_at IS NULL
      `,
      {
        id,
        userId,
        content: input.content?.trim() || null,
        status: input.status || null,
      },
    );
  });
  return getPost(id, userId);
}

export async function deletePost(id: string, userId: string) {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        UPDATE posts
        SET deleted_at = UTC_TIMESTAMP(3), status = 'DELETED'
        WHERE id = :id AND author_id = :userId AND deleted_at IS NULL
      `,
      { id, userId },
    );
  });
  return { deleted: true };
}

export async function listComments(postId: string, options: { limit?: number; cursor?: string | null } = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 30, 1), 100);
  const where = ["c.post_id = :postId", "c.deleted_at IS NULL"];
  const params: Record<string, unknown> = { postId, limit };
  if (options.cursor) {
    where.push("c.id < :cursor");
    params.cursor = options.cursor;
  }

  const rows = await queryRows<CommentRow>(
    `
      SELECT c.id, c.post_id, c.author_id, u.name_th AS author_name, c.content, c.created_at
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE ${where.join(" AND ")}
      ORDER BY c.id DESC
      LIMIT :limit
    `,
    params,
  );

  return {
    items: rows.map(mapComment).reverse(),
    nextCursor: rows.length === limit ? String(rows[rows.length - 1].id) : null,
  };
}

export async function createComment(postId: string, authorId: string, content: string) {
  const text = content.trim();
  if (!text) throw new Error("content_required");

  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO comments (post_id, author_id, content)
        VALUES (:postId, :authorId, :content)
      `,
      { postId, authorId, content: text },
    );
    return String(result.insertId);
  });

  await awardPoints({
    userId: authorId,
    action: "commentCreated",
    sourceType: "COMMENT",
    sourceId: id,
    idempotencyKey: `comment:${id}:created`,
    description: "Comment",
  }).catch(() => null);

  const rows = await queryRows<CommentRow>(
    `
      SELECT c.id, c.post_id, c.author_id, u.name_th AS author_name, c.content, c.created_at
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.id = :id
      LIMIT 1
    `,
    { id },
  );
  return rows[0] ? mapComment(rows[0]) : null;
}

export async function setReaction(postId: string, userId: string, reactionType = "LIKE") {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO reactions (post_id, user_id, reaction_type)
        VALUES (:postId, :userId, :reactionType)
        ON DUPLICATE KEY UPDATE
          reaction_type = VALUES(reaction_type),
          created_at = created_at
      `,
      { postId, userId, reactionType },
    );
  });

  await awardPoints({
    userId,
    action: "reactionCreated",
    sourceType: "REACTION",
    sourceId: postId,
    idempotencyKey: `reaction:${postId}:${userId}`,
    description: "Reaction",
  }).catch(() => null);

  return { postId, userId, reactionType };
}

export async function deleteReaction(postId: string, userId: string) {
  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      "DELETE FROM reactions WHERE post_id = :postId AND user_id = :userId",
      { postId, userId },
    );
  });
  return { deleted: true };
}
