import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { awardPoints } from "@backend/components/points/repository";

type PostRow = RowDataPacket & {
  id: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  organization_id: string | null;
  organization_name: string | null;
  team_id: string | null;
  team_name: string | null;
  event_id: string | null;
  category: string | null;
  content: string;
  points_awarded: number | string;
  status: string;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  like_count: number | string;
  comment_count: number | string;
  has_liked: 0 | 1 | boolean;
  photos_json: string | null;
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
  let photos: Array<{ id: string; dataUrl: string; type: string; url: string }> = [];
  if (row.photos_json) {
    try {
      photos = (JSON.parse(row.photos_json) as Array<Record<string, unknown>>)
        .filter((photo) => photo?.id)
        .map((photo) => {
          const id = String(photo.id);
          const url = String(photo.url || `/api/uploads/${id}/download`);
          return {
            id,
            dataUrl: url,
            url,
            type: String(photo.type || "upload"),
          };
        });
    } catch {
      photos = [];
    }
  }

  return {
    id: String(row.id),
    authorId: String(row.author_id),
    authorName: row.author_name || "Unknown user",
    authorEmail: row.author_email,
    organizationId: row.organization_id ? String(row.organization_id) : null,
    organizationName: row.organization_name,
    teamId: row.team_id ? String(row.team_id) : null,
    teamName: row.team_name,
    eventId: row.event_id ? String(row.event_id) : null,
    category: row.category || "ทั่วไป",
    content: row.content,
    pointsAwarded: Number(row.points_awarded || 0),
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0),
    hasLiked: Boolean(row.has_liked),
    photos,
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
    p.organization_id,
    p.team_id,
    p.event_id,
    p.category,
    u.name_th AS author_name,
    u.email AS author_email,
    o.name_th AS organization_name,
    t.name AS team_name,
    p.content,
    p.points_awarded,
    p.status,
    p.published_at,
    p.created_at,
    p.updated_at,
    (SELECT COUNT(*) FROM reactions r WHERE r.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
    EXISTS(SELECT 1 FROM reactions vr WHERE vr.post_id = p.id AND vr.user_id = :viewerId) AS has_liked,
    (
      SELECT CONCAT(
        '[',
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', CAST(ma.id AS CHAR),
            'url', COALESCE(ma.public_url, CONCAT('/api/uploads/', ma.id, '/download')),
            'type', COALESCE(ma.mime_type, 'image')
          )
          ORDER BY pm.sort_order, ma.id
          SEPARATOR ','
        ),
        ']'
      )
      FROM post_media pm
      JOIN media_assets ma ON ma.id = pm.media_asset_id
      WHERE pm.post_id = p.id
        AND ma.deleted_at IS NULL
        AND ma.status <> 'DELETED'
    ) AS photos_json
  FROM posts p
  LEFT JOIN users u ON u.id = p.author_id
  LEFT JOIN organizations o ON o.id = p.organization_id
  LEFT JOIN teams t ON t.id = p.team_id
`;

async function getUserTeamContext(userId: string) {
  const rows = await queryRows<RowDataPacket & {
    organization_id: string | null;
    team_id: string | null;
  }>(
    `
      SELECT
        u.organization_id,
        (
          SELECT tm.team_id
          FROM team_members tm
          JOIN teams t ON t.id = tm.team_id
          WHERE tm.user_id = u.id
            AND tm.left_at IS NULL
            AND t.deleted_at IS NULL
            AND t.status = 'ACTIVE'
          ORDER BY tm.joined_at DESC
          LIMIT 1
        ) AS team_id
      FROM users u
      WHERE u.id = :userId
      LIMIT 1
    `,
    { userId },
  );
  return {
    organizationId: rows[0]?.organization_id ? String(rows[0].organization_id) : null,
    teamId: rows[0]?.team_id ? String(rows[0].team_id) : null,
  };
}

export async function listPosts(options: {
  viewerId: string;
  limit?: number;
  cursor?: string | null;
  status?: string | null;
  scope?: "all" | "my-team" | "mine";
  category?: string | null;
}) {
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
  if (options.category?.trim() && options.category !== "ทั้งหมด" && options.category !== "ทีมของฉัน") {
    where.push("p.category = :category");
    params.category = options.category.trim();
  }
  if (options.scope === "mine") {
    where.push("p.author_id = :viewerId");
  } else if (options.scope === "my-team") {
    const context = await getUserTeamContext(options.viewerId);
    if (!context.teamId) {
      return { items: [], nextCursor: null, teamId: null };
    }
    where.push("p.team_id = :teamId");
    params.teamId = context.teamId;
  }

  const rows = await queryRows<PostRow>(
    `
      ${SELECT_POSTS_SQL}
      WHERE ${where.join(" AND ")}
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
      LIMIT 1
    `,
    { id, viewerId },
  );
  return rows[0] ? mapPost(rows[0]) : null;
}

export async function createPost(input: {
  authorId: string;
  content: string;
  category?: string | null;
  status?: string;
  attachmentIds?: Array<string | number>;
  eventId?: string | number | null;
}) {
  const content = input.content.trim();
  if (!content) throw new Error("content_required");
  const category = String(input.category || "ทั่วไป").trim() || "ทั่วไป";
  const context = await getUserTeamContext(input.authorId);

  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO posts (
          author_id,
          organization_id,
          team_id,
          event_id,
          category,
          content,
          status,
          published_at
        )
        VALUES (
          :authorId,
          :organizationId,
          :teamId,
          :eventId,
          :category,
          :content,
          :status,
          CASE WHEN :status = 'PUBLISHED' THEN UTC_TIMESTAMP(3) ELSE NULL END
        )
      `,
      {
        authorId: input.authorId,
        organizationId: context.organizationId,
        teamId: context.teamId,
        eventId: input.eventId || null,
        category,
        content,
        status: input.status || "PUBLISHED",
      },
    );
    const postId = String(result.insertId);
    const attachmentIds = (input.attachmentIds || [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 5);
    for (let index = 0; index < attachmentIds.length; index += 1) {
      const mediaId = attachmentIds[index];
      await connection.execute(
        `
          INSERT IGNORE INTO post_media (post_id, media_asset_id, sort_order)
          VALUES (:postId, :mediaId, :sortOrder)
        `,
        { postId, mediaId, sortOrder: index },
      );
      await connection.execute(
        `
          UPDATE media_assets
          SET owner_type='post', owner_id=:postId, link_type='attachment', status='LINKED'
          WHERE id=:mediaId AND created_by=:authorId AND deleted_at IS NULL
        `,
        { postId, mediaId, authorId: input.authorId },
      );
    }
    return postId;
  });

  const balance = await awardPoints({
    userId: input.authorId,
    action: "safetyPostApproved",
    sourceType: "POST",
    sourceId: id,
    idempotencyKey: `post:${id}:approved`,
    description: "สร้าง Safety Post ที่อนุมัติ",
  }).catch(() => null);
  if (balance) {
    const ruleRows = await queryRows<RowDataPacket & { amount: number | string }>(
      "SELECT amount FROM point_transactions WHERE idempotency_key = :key LIMIT 1",
      { key: `post:${id}:approved` },
    ).catch(() => []);
    const pointsAwarded = Number(ruleRows[0]?.amount || 0);
    if (pointsAwarded > 0) {
      await withTransaction(async (connection) => {
        await connection.execute(
          "UPDATE posts SET points_awarded = :pointsAwarded WHERE id = :id",
          { id, pointsAwarded },
        );
      });
    }
  }

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
