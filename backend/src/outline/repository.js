const { randomUUID } = require('crypto');
const db = require('../../config/database');

const OUTLINE_COLUMNS = [
  'id',
  'project_id',
  'title',
  'status',
  'created_at',
  'updated_at',
];

const OUTLINE_SELECT = OUTLINE_COLUMNS.join(', ');
const STATUS_VALUES = ['draft', 'published'];

const ITEM_COLUMNS = [
  'id',
  'outline_id',
  'parent_item_id',
  'level',
  'title',
  'content',
  'order_index',
  'created_at',
];

const ITEM_SELECT = ITEM_COLUMNS.join(', ');

function mapOutlineRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapOutlineItemRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    outline_id: row.outline_id,
    parent_item_id: row.parent_item_id,
    level: row.level,
    title: row.title,
    content: row.content,
    order_index: row.order_index,
    created_at: row.created_at,
  };
}

async function queryOutlines(text, params = []) {
  const result = await db.query(text, params);
  return result.rows.map(mapOutlineRow);
}

async function queryOutlineItems(text, params = []) {
  const result = await db.query(text, params);
  return result.rows.map(mapOutlineItemRow);
}

async function listByUser(userId, projectId) {
  const params = [userId];
  let projectFilter = '';

  if (projectId) {
    params.push(projectId);
    projectFilter = ' AND o.project_id = $2';
  }

  return queryOutlines(
    `SELECT o.${OUTLINE_SELECT}
     FROM outlines o
     INNER JOIN learning_projects p ON p.id = o.project_id
     WHERE p.user_id = $1${projectFilter}
     ORDER BY o.updated_at DESC, o.created_at DESC`,
    params
  );
}

async function createOutlineForUser(payload) {
  const {
    userId,
    projectId,
    title,
    status,
    items = [],
  } = payload;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      `SELECT id
       FROM learning_projects
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const outlineResult = await client.query(
      `INSERT INTO outlines (
        project_id,
        title,
        status
      ) VALUES ($1, $2, $3)
      RETURNING ${OUTLINE_SELECT}`,
      [projectId, title, status || 'draft']
    );

    const outline = mapOutlineRow(outlineResult.rows[0]);

    if (items.length > 0) {
      const idMap = new Map();
      items.forEach((item) => {
        idMap.set(item.clientKey, randomUUID());
      });

      const values = [];
      const params = [];

      items.forEach((item) => {
        params.push(
          idMap.get(item.clientKey),
          outline.id,
          item.parentClientKey ? idMap.get(item.parentClientKey) : null,
          item.level,
          item.title,
          item.content,
          item.orderIndex
        );

        const base = params.length - 6;
        values.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      });

      await client.query(
        `INSERT INTO outline_items (
          id,
          outline_id,
          parent_item_id,
          level,
          title,
          content,
          order_index
        ) VALUES ${values.join(', ')}`,
        params
      );
    }

    await client.query('COMMIT');
    return outline;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function findById(outlineId) {
  const result = await db.query(
    `SELECT ${OUTLINE_SELECT}
     FROM outlines
     WHERE id = $1
     LIMIT 1`,
    [outlineId]
  );

  return mapOutlineRow(result.rows[0]);
}

async function findCurrentByProjectForUser(projectId, userId) {
  const result = await db.query(
    `SELECT o.${OUTLINE_SELECT}
     FROM outlines o
     INNER JOIN learning_projects p ON p.id = o.project_id
     WHERE o.project_id = $1
       AND p.user_id = $2
       AND (
         p.current_outline_id = o.id
         OR p.current_outline_id IS NULL
       )
     ORDER BY CASE WHEN p.current_outline_id = o.id THEN 0 ELSE 1 END,
              o.updated_at DESC,
              o.created_at DESC
     LIMIT 1`,
    [projectId, userId]
  );

  return mapOutlineRow(result.rows[0]);
}

async function findItemsByOutlineId(outlineId) {
  return queryOutlineItems(
    `SELECT ${ITEM_SELECT}
     FROM outline_items
     WHERE outline_id = $1
     ORDER BY order_index ASC`,
    [outlineId]
  );
}

async function updateStatus(outlineId, status) {
  if (!STATUS_VALUES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const result = await db.query(
    `UPDATE outlines
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${OUTLINE_SELECT}`,
    [status, outlineId]
  );

  return mapOutlineRow(result.rows[0]);
}

async function replaceOutlineItems(outlineId, items = []) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM outline_items
       WHERE outline_id = $1`,
      [outlineId]
    );

    if (items.length > 0) {
      const idMap = new Map();
      items.forEach((item) => {
        idMap.set(item.clientKey, randomUUID());
      });

      const values = [];
      const params = [];

      items.forEach((item) => {
        params.push(
          idMap.get(item.clientKey),
          outlineId,
          item.parentClientKey ? idMap.get(item.parentClientKey) : null,
          item.level,
          item.title,
          item.content,
          item.orderIndex
        );

        const base = params.length - 6;
        values.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      });

      await client.query(
        `INSERT INTO outline_items (
          id,
          outline_id,
          parent_item_id,
          level,
          title,
          content,
          order_index
        ) VALUES ${values.join(', ')}`,
        params
      );
    }

    const outlineResult = await client.query(
      `UPDATE outlines
       SET status = 'draft', updated_at = NOW()
       WHERE id = $1
       RETURNING ${OUTLINE_SELECT}`,
      [outlineId]
    );

    await client.query('COMMIT');
    return mapOutlineRow(outlineResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteOutline(outlineId) {
  const result = await db.query(
    `DELETE FROM outlines
     WHERE id = $1
     RETURNING ${OUTLINE_SELECT}`,
    [outlineId]
  );

  return mapOutlineRow(result.rows[0]);
}

module.exports = {
  OUTLINE_COLUMNS,
  OUTLINE_SELECT,
  STATUS_VALUES,
  ITEM_COLUMNS,
  ITEM_SELECT,
  mapOutlineRow,
  mapOutlineItemRow,
  queryOutlines,
  queryOutlineItems,
  listByUser,
  createOutlineForUser,
  findById,
  findCurrentByProjectForUser,
  findItemsByOutlineId,
  updateStatus,
  replaceOutlineItems,
  deleteOutline,
};
