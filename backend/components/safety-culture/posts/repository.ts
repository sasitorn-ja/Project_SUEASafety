import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { queryRows, withTransaction } from "@backend/components/core/db";
import { awardPoints } from "@backend/components/points/repository";

type PostRow = RowDataPacket & {
  id: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  author_profile_image_url: string | null;
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
  has_liked: 0 | 1 | "0" | "1" | boolean;
  liked_by_json: string | Array<Record<string, unknown>> | null;
  photos_json: string | null;
};

type CommentRow = RowDataPacket & {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string | null;
  author_profile_image_url: string | null;
  content: string;
  created_at: Date | string;
  reactions_json?: string | null;
  viewer_reaction?: string | null;
};

type CultureEventRow = RowDataPacket & {
  id: string;
  status: string;
  event_start_at: Date | string | null;
  event_end_at: Date | string | null;
  metadata: string | Record<string, unknown> | null;
};

function mapHasLiked(value: PostRow["has_liked"]) {
  return value === true || value === 1 || value === "1";
}

function mapPost(row: PostRow) {
  let photos: Array<{ id: string; dataUrl: string; type: string; url: string }> = [];
  let likedBy: Array<{ userId: string; name: string; profileImageUrl: string | null }> = [];
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
  if (row.liked_by_json) {
    try {
      const parsed = typeof row.liked_by_json === "string" ? JSON.parse(row.liked_by_json) : row.liked_by_json;
      likedBy = (Array.isArray(parsed) ? parsed : []).map((person) => ({
        userId: String(person.userId || ""),
        name: String(person.name || "ผู้ใช้งาน"),
        profileImageUrl: typeof person.profileImageUrl === "string" ? person.profileImageUrl : null,
      }));
    } catch {
      likedBy = [];
    }
  }

  return {
    id: String(row.id),
    authorId: String(row.author_id),
    authorName: row.author_name || "Unknown user",
    authorEmail: row.author_email,
    authorProfileImageUrl: row.author_profile_image_url || null,
    organizationId: row.organization_id ? String(row.organization_id) : null,
    organizationName: row.organization_name,
    teamId: row.team_id ? String(row.team_id) : null,
    teamName: row.team_name,
    teamScope: row.team_id ? "team" : "unassigned",
    eventId: row.event_id ? String(row.event_id) : null,
    category: row.category || "ทั่วไป",
    content: row.content,
    pointsAwarded: Number(row.points_awarded || 0),
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    likeCount: Number(row.like_count || 0),
    likedBy,
    commentCount: Number(row.comment_count || 0),
    hasLiked: mapHasLiked(row.has_liked),
    photos,
  };
}

function mapComment(row: CommentRow) {
  let reactions: Record<string, number> = {};
  if (row.reactions_json) {
    try { reactions = JSON.parse(row.reactions_json); } catch { reactions = {}; }
  }
  return {
    id: String(row.id),
    postId: String(row.post_id),
    authorId: String(row.author_id),
    authorName: row.author_name || "Unknown user",
    authorProfileImageUrl: row.author_profile_image_url || null,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
    reactions,
    viewerReaction: row.viewer_reaction || null,
  };
}

function parseMetadata(value: CultureEventRow["metadata"]) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

async function resolvePostPoints(eventId?: string | number | null) {
  const ruleRows = await queryRows<RowDataPacket & { id: string; points: number | string }>(
    "SELECT id, points FROM point_rules WHERE code='safetyPostApproved' AND status='ACTIVE' LIMIT 1",
  ).catch(() => []);
  const fallback = 6;
  if (!eventId) return { amount: Number(ruleRows[0]?.points || fallback), pointRuleId: ruleRows[0]?.id || null };

  const eventRows = await queryRows<CultureEventRow>(
    `SELECT id, status, event_start_at, event_end_at, metadata
     FROM safety_culture_events WHERE id=:eventId AND deleted_at IS NULL LIMIT 1`,
    { eventId },
  );
  const event = eventRows[0];
  if (!event || event.status !== "ACTIVE") throw new Error("event_not_available");
  const metadata = parseMetadata(event.metadata);
  const now = Date.now();
  const start = metadata.startDate ? new Date(`${metadata.startDate}T00:00:00`).getTime() : event.event_start_at ? new Date(event.event_start_at).getTime() : NaN;
  const end = metadata.endDate ? new Date(`${metadata.endDate}T23:59:59.999`).getTime() : event.event_end_at ? new Date(event.event_end_at).getTime() : NaN;
  if ((!Number.isNaN(start) && now < start) || (!Number.isNaN(end) && now > end)) throw new Error("event_not_live");
  const actions = Array.isArray(metadata.enabledActions) ? metadata.enabledActions.map(String) : [];
  const basePoints = Number(ruleRows[0]?.points || fallback);
  let amount = basePoints;
  if (actions.includes("theme-post")) {
    const eventPoints = Math.max(0, Number(metadata.points) || 0);
    const eventBonus = metadata.bonusMode === "multiplier"
      ? Math.round(eventPoints * Math.max(1, Number(metadata.multiplier) || 1))
      : eventPoints + Math.max(0, Number(metadata.fixedPoints) || 0);
    amount = basePoints + eventBonus;
  }
  return { amount, pointRuleId: ruleRows[0]?.id || null };
}

async function createNotification(connection: any, input: { userId: string; actorId: string; type: string; title: string; body: string; metadata: Record<string, unknown> }) {
  if (String(input.userId) === String(input.actorId)) return;
  await connection.execute(
    `INSERT INTO notifications (user_id, notification_type, title, body, metadata)
     VALUES (:userId, :type, :title, :body, :metadata)`,
    { ...input, metadata: JSON.stringify({ ...input.metadata, actorUserId: input.actorId }) },
  );
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
    u.profile_image_url AS author_profile_image_url,
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
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'userId', CAST(lu.id AS CHAR),
          'name', COALESCE(NULLIF(lu.name_th, ''), NULLIF(lu.name_en, ''), lu.email, 'ผู้ใช้งาน'),
          'profileImageUrl', lu.profile_image_url
        )
      )
      FROM reactions lr
      JOIN users lu ON lu.id = lr.user_id
      WHERE lr.post_id = p.id AND lu.deleted_at IS NULL
    ) AS liked_by_json,
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
  const points = await resolvePostPoints(input.eventId);

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
          points_awarded,
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
          :pointsAwarded,
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
        pointsAwarded: points.amount,
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
    if (points.amount > 0) {
      const [pointResult] = await connection.execute<ResultSetHeader>(
        `INSERT IGNORE INTO point_transactions
         (user_id, point_rule_id, transaction_type, amount, source_type, source_id, idempotency_key, description)
         VALUES (:userId, :pointRuleId, 'EARN', :amount, 'POST', :postId, :key, :description)`,
        {
          userId: input.authorId,
          pointRuleId: points.pointRuleId,
          amount: points.amount,
          postId,
          key: `post:${postId}:approved`,
          description: input.eventId ? "สร้าง Safety Post ใน Card Event" : "สร้าง Safety Post ที่อนุมัติ",
        },
      );
      if (pointResult.affectedRows > 0) {
        await connection.execute(
          `INSERT INTO point_balances (user_id, balance) VALUES (:userId, :amount)
           ON DUPLICATE KEY UPDATE balance=balance+:amount, updated_at=UTC_TIMESTAMP(3)`,
          { userId: input.authorId, amount: points.amount },
        );
      }
    }
    return postId;
  });

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
  return withTransaction(async (connection) => {
    const [postRows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, author_id, points_awarded
       FROM posts
       WHERE id = :id AND author_id = :userId AND deleted_at IS NULL
       FOR UPDATE`,
      { id, userId },
    );
    const post = postRows[0] as (RowDataPacket & { points_awarded: number | string | null }) | undefined;
    if (!post) return { deleted: false, pointsReversed: 0, balance: null };

    const [deleteResult] = await connection.execute<ResultSetHeader>(
      `
        UPDATE posts
        SET deleted_at = UTC_TIMESTAMP(3)
        WHERE id = :id AND author_id = :userId AND deleted_at IS NULL
      `,
      { id, userId },
    );

    let pointsReversed = 0;
    if (deleteResult.affectedRows > 0) {
      try {
        const [earnedRows] = await connection.execute<RowDataPacket[]>(
          `SELECT id, point_rule_id, amount
           FROM point_transactions
           WHERE user_id = :userId AND idempotency_key = :earnKey
           LIMIT 1`,
          { userId, earnKey: `post:${id}:approved` },
        );
        const earned = earnedRows[0] as (RowDataPacket & { point_rule_id: string | null; amount: number | string }) | undefined;
        const pointsToReverse = Math.max(0, Number(earned?.amount ?? post.points_awarded ?? 0));

        if (pointsToReverse > 0) {
          const [reversal] = await connection.execute<ResultSetHeader>(
            `INSERT IGNORE INTO point_transactions
             (user_id, point_rule_id, transaction_type, amount, source_type, source_id, idempotency_key, description)
             VALUES (:userId, :pointRuleId, 'SPEND', :amount, 'POST_DELETION', :postId, :reversalKey, :description)`,
            {
              userId,
              pointRuleId: earned?.point_rule_id || null,
              amount: -pointsToReverse,
              postId: id,
              reversalKey: `post:${id}:delete-reversal`,
              description: `Reverse points for deleted Safety Post #${id}`,
            },
          );
          if (reversal.affectedRows > 0) {
            pointsReversed = pointsToReverse;
            await connection.execute<ResultSetHeader>(
              `INSERT INTO point_balances (user_id, balance)
               VALUES (:userId, :amount)
               ON DUPLICATE KEY UPDATE balance = balance + :amount, updated_at = UTC_TIMESTAMP(3)`,
              { userId, amount: -pointsToReverse },
            );
          }
        }
      } catch {
        pointsReversed = 0;
      }
    }
    const [balanceRows] = await connection.execute<RowDataPacket[]>(
      "SELECT balance FROM point_balances WHERE user_id = :userId LIMIT 1",
      { userId },
    );
    const balance = Number((balanceRows[0] as RowDataPacket & { balance?: number | string } | undefined)?.balance || 0);
    return { deleted: deleteResult.affectedRows > 0, pointsReversed, balance };
  });
}

export async function listComments(postId: string, options: { limit?: number; cursor?: string | null; viewerId?: string | null } = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 30, 1), 100);
  const where = ["c.post_id = :postId", "c.deleted_at IS NULL"];
  const params: Record<string, unknown> = { postId, limit, viewerId: options.viewerId || 0 };
  if (options.cursor) {
    where.push("c.id < :cursor");
    params.cursor = options.cursor;
  }

  const rows = await queryRows<CommentRow>(
    `
      SELECT c.id, c.post_id, c.author_id, u.name_th AS author_name, u.profile_image_url AS author_profile_image_url, c.content, c.created_at,
        (SELECT cr.reaction_type FROM comment_reactions cr WHERE cr.comment_id=c.id AND cr.user_id=:viewerId LIMIT 1) viewer_reaction
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE ${where.join(" AND ")}
      ORDER BY c.id DESC
      LIMIT :limit
    `,
    params,
  );

  const reactionRows = rows.length ? await queryRows<RowDataPacket & { comment_id: string; reaction_type: string; reaction_count: number | string }>(
    `SELECT comment_id, reaction_type, COUNT(*) reaction_count FROM comment_reactions
     WHERE comment_id IN (:commentIds) GROUP BY comment_id, reaction_type`,
    { commentIds: rows.map((row) => row.id) },
  ) : [];
  const reactionsByComment = new Map<string, Record<string, number>>();
  for (const reaction of reactionRows) {
    const counts = reactionsByComment.get(String(reaction.comment_id)) || {};
    counts[reaction.reaction_type] = Number(reaction.reaction_count);
    reactionsByComment.set(String(reaction.comment_id), counts);
  }

  return {
    items: rows.map((row) => mapComment({ ...row, reactions_json: JSON.stringify(reactionsByComment.get(String(row.id)) || {}) } as CommentRow)).reverse(),
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
    const [owners] = await connection.execute<RowDataPacket[]>(
      `SELECT p.author_id, u.name_th actor_name FROM posts p LEFT JOIN users u ON u.id=:authorId
       WHERE p.id=:postId AND p.deleted_at IS NULL LIMIT 1`,
      { postId, authorId },
    );
    const owner = owners[0] as (RowDataPacket & { author_id?: string; actor_name?: string }) | undefined;
    if (owner?.author_id) {
      await createNotification(connection, {
        userId: String(owner.author_id), actorId: authorId, type: "COMMENT",
        title: `${owner.actor_name || "มีผู้ใช้"} แสดงความคิดเห็นในโพสต์ของคุณ`, body: text,
        metadata: { postId, commentId: String(result.insertId), href: `/safety-culture/posts/${postId}` },
      });
    }
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
      SELECT c.id, c.post_id, c.author_id, u.name_th AS author_name, u.profile_image_url AS author_profile_image_url, c.content, c.created_at
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.id = :id
      LIMIT 1
    `,
    { id },
  );
  return rows[0] ? mapComment(rows[0]) : null;
}

export async function updateComment(commentId: string, authorId: string, content: string) {
  const text = content.trim();
  if (!text) throw new Error("content_required");

  await withTransaction(async (connection) => {
    await connection.execute<ResultSetHeader>(
      `
        UPDATE comments
        SET content = :content
        WHERE id = :commentId AND author_id = :authorId AND deleted_at IS NULL
      `,
      { commentId, authorId, content: text },
    );
  });

  const rows = await queryRows<CommentRow>(
    `
      SELECT c.id, c.post_id, c.author_id, u.name_th AS author_name, u.profile_image_url AS author_profile_image_url, c.content, c.created_at
      FROM comments c
      LEFT JOIN users u ON u.id = c.author_id
      WHERE c.id = :commentId AND c.author_id = :authorId AND c.deleted_at IS NULL
      LIMIT 1
    `,
    { commentId, authorId },
  );
  return rows[0] ? mapComment(rows[0]) : null;
}

export async function deleteComment(commentId: string, authorId: string) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `
        UPDATE comments
        SET deleted_at = UTC_TIMESTAMP(3)
        WHERE id = :commentId AND author_id = :authorId AND deleted_at IS NULL
      `,
      { commentId, authorId },
    );
    return { deleted: result.affectedRows > 0 };
  });
}

export async function setReaction(postId: string, userId: string, reactionType = "LIKE") {
  await withTransaction(async (connection) => {
    const [existingRows] = await connection.execute<RowDataPacket[]>(
      "SELECT reaction_type FROM reactions WHERE post_id=:postId AND user_id=:userId LIMIT 1", { postId, userId },
    );
    const isNew = !existingRows[0];

    // Plain INSERT/UPDATE instead of "ON DUPLICATE KEY UPDATE" so this works even
    // when the legacy reactions table has no UNIQUE(post_id, user_id) key.
    if (isNew) {
      await connection.execute<ResultSetHeader>(
        "INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (:postId, :userId, :reactionType)",
        { postId, userId, reactionType },
      );
    } else {
      await connection.execute<ResultSetHeader>(
        "UPDATE reactions SET reaction_type=:reactionType WHERE post_id=:postId AND user_id=:userId",
        { reactionType, postId, userId },
      );
    }

    if (isNew) {
      // A failure to notify the author must never block the like itself.
      try {
        const [owners] = await connection.execute<RowDataPacket[]>(
          `SELECT p.author_id, u.name_th actor_name FROM posts p LEFT JOIN users u ON u.id=:userId
           WHERE p.id=:postId AND p.deleted_at IS NULL LIMIT 1`, { postId, userId },
        );
        const owner = owners[0] as (RowDataPacket & { author_id?: string; actor_name?: string }) | undefined;
        if (owner?.author_id) await createNotification(connection, {
          userId: String(owner.author_id), actorId: userId, type: "LIKE",
          title: `${owner.actor_name || "มีผู้ใช้"} กดถูกใจโพสต์ของคุณ`, body: "กดเพื่อดูโพสต์",
          metadata: { postId, href: `/safety-culture/posts/${postId}` },
        });
      } catch {
        // ignore notification errors
      }
    }
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

export async function setCommentReaction(commentId: string, userId: string, reactionType: string) {
  const allowed = new Set(["like", "love", "care", "wow", "useful"]);
  if (!allowed.has(reactionType)) throw new Error("invalid_reaction_type");
  await withTransaction(async (connection) => {
    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT reaction_type FROM comment_reactions WHERE comment_id=:commentId AND user_id=:userId LIMIT 1",
      { commentId, userId },
    );
    await connection.execute(
      `INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
       VALUES (:commentId, :userId, :reactionType)
       ON DUPLICATE KEY UPDATE reaction_type=VALUES(reaction_type), updated_at=UTC_TIMESTAMP(3)`,
      { commentId, userId, reactionType },
    );
    if (!existing[0] || String(existing[0].reaction_type) !== reactionType) {
      const [owners] = await connection.execute<RowDataPacket[]>(
        `SELECT c.author_id, c.post_id, u.name_th actor_name FROM comments c LEFT JOIN users u ON u.id=:userId
         WHERE c.id=:commentId AND c.deleted_at IS NULL LIMIT 1`, { commentId, userId },
      );
      const owner = owners[0] as (RowDataPacket & { author_id?: string; post_id?: string; actor_name?: string }) | undefined;
      if (owner?.author_id && owner.post_id) await createNotification(connection, {
        userId: String(owner.author_id), actorId: userId, type: "COMMENT_REACTION",
        title: `${owner.actor_name || "มีผู้ใช้"} แสดงความรู้สึกต่อความคิดเห็นของคุณ`, body: "กดเพื่อดูความคิดเห็น",
        metadata: { postId: String(owner.post_id), commentId, href: `/safety-culture/posts/${owner.post_id}` },
      });
    }
  });
  return { commentId, userId, reactionType };
}

export async function deleteCommentReaction(commentId: string, userId: string) {
  await withTransaction(async (connection) => connection.execute(
    "DELETE FROM comment_reactions WHERE comment_id=:commentId AND user_id=:userId", { commentId, userId },
  ));
  return { deleted: true };
}
