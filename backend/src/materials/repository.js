const db = require('../../config/database');

const MATERIAL_COLUMNS = [
  'id',
  'project_id',
  'source_kind',
  'material_type',
  'title',
  'original_file_name',
  'mime_type',
  'storage_path',
  'raw_text',
  'extracted_text',
  'weight',
  'is_active',
  'source_version',
  'created_at',
  'updated_at',
];

const MATERIAL_SELECT = MATERIAL_COLUMNS.join(', ');
const MATERIAL_SELECT_WITH_ALIAS = (alias) => MATERIAL_COLUMNS.map((column) => `${alias}.${column}`).join(', ');
const MATERIAL_MUTABLE_FIELDS = [
  'source_kind',
  'material_type',
  'title',
  'original_file_name',
  'mime_type',
  'storage_path',
  'raw_text',
  'extracted_text',
  'weight',
  'is_active',
  'source_version',
];

function mapMaterialRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    project_id: row.project_id,
    source_kind: row.source_kind,
    material_type: row.material_type,
    title: row.title,
    original_file_name: row.original_file_name,
    mime_type: row.mime_type,
    storage_path: row.storage_path,
    raw_text: row.raw_text,
    extracted_text: row.extracted_text,
    weight: row.weight,
    is_active: row.is_active,
    source_version: row.source_version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function queryMaterials(text, params = []) {
  const result = await db.query(text, params);
  return result.rows.map(mapMaterialRow);
}

async function listByProject(projectId) {
  return queryMaterials(
    `SELECT ${MATERIAL_SELECT}
     FROM source_materials
     WHERE project_id = $1
     ORDER BY created_at DESC, id DESC`,
    [projectId]
  );
}

async function listByProjectForUser(projectId, userId) {
  return queryMaterials(
    `SELECT ${MATERIAL_SELECT_WITH_ALIAS('m')}
     FROM source_materials m
     INNER JOIN learning_projects p ON p.id = m.project_id
     WHERE m.project_id = $1 AND p.user_id = $2
     ORDER BY m.created_at DESC, m.id DESC`,
    [projectId, userId]
  );
}

async function createMaterial(payload) {
  const result = await db.query(
    `INSERT INTO source_materials (
      project_id,
      source_kind,
      material_type,
      title,
      original_file_name,
      mime_type,
      storage_path,
      raw_text,
      extracted_text,
      weight,
      is_active,
      source_version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING ${MATERIAL_SELECT}`,
    [
      payload.projectId,
      payload.sourceKind,
      payload.materialType,
      payload.title || null,
      payload.originalFileName || null,
      payload.mimeType || null,
      payload.storagePath || null,
      payload.rawText || null,
      payload.extractedText || null,
      payload.weight ?? 1.0,
      payload.isActive ?? true,
      payload.sourceVersion ?? 1,
    ]
  );

  return mapMaterialRow(result.rows[0]);
}

async function createMaterialForUser(payload) {
  const result = await db.query(
    `INSERT INTO source_materials (
      project_id,
      source_kind,
      material_type,
      title,
      original_file_name,
      mime_type,
      storage_path,
      raw_text,
      extracted_text,
      weight,
      is_active,
      source_version
    )
    SELECT p.id, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    FROM learning_projects p
    WHERE p.id = $1 AND p.user_id = $2
    RETURNING ${MATERIAL_SELECT}`,
    [
      payload.projectId,
      payload.userId,
      payload.sourceKind,
      payload.materialType,
      payload.title || null,
      payload.originalFileName || null,
      payload.mimeType || null,
      payload.storagePath || null,
      payload.rawText || null,
      payload.extractedText || null,
      payload.weight ?? 1.0,
      payload.isActive ?? true,
      payload.sourceVersion ?? 1,
    ]
  );

  return mapMaterialRow(result.rows[0]);
}

async function findById(materialId) {
  const result = await db.query(
    `SELECT ${MATERIAL_SELECT}
     FROM source_materials
     WHERE id = $1
     LIMIT 1`,
    [materialId]
  );

  return mapMaterialRow(result.rows[0]);
}

async function findByIdForUser(materialId, userId) {
  const result = await db.query(
    `SELECT ${MATERIAL_SELECT_WITH_ALIAS('m')}
     FROM source_materials m
     INNER JOIN learning_projects p ON p.id = m.project_id
     WHERE m.id = $1 AND p.user_id = $2
     LIMIT 1`,
    [materialId, userId]
  );

  return mapMaterialRow(result.rows[0]);
}

async function updateMaterial(materialId, updates) {
  const assignments = [];
  const params = [materialId];

  MATERIAL_MUTABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      params.push(updates[field]);
      assignments.push(`${field} = $${params.length}`);
    }
  });

  if (assignments.length === 0) {
    return findById(materialId);
  }

  const result = await db.query(
    `UPDATE source_materials
     SET ${assignments.join(', ')}
     WHERE id = $1
     RETURNING ${MATERIAL_SELECT}`,
    params
  );

  return mapMaterialRow(result.rows[0]);
}

async function updateMaterialForUser(materialId, userId, updates) {
  const assignments = [];
  const params = [materialId, userId];

  MATERIAL_MUTABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      params.push(updates[field]);
      assignments.push(`${field} = $${params.length}`);
    }
  });

  if (assignments.length === 0) {
    return findByIdForUser(materialId, userId);
  }

  const result = await db.query(
    `UPDATE source_materials AS m
     SET ${assignments.join(', ')}
     FROM learning_projects AS p
     WHERE m.id = $1
       AND p.id = m.project_id
       AND p.user_id = $2
     RETURNING ${MATERIAL_SELECT_WITH_ALIAS('m')}`,
    params
  );

  return mapMaterialRow(result.rows[0]);
}

module.exports = {
  MATERIAL_COLUMNS,
  MATERIAL_SELECT,
  MATERIAL_SELECT_WITH_ALIAS,
  MATERIAL_MUTABLE_FIELDS,
  mapMaterialRow,
  queryMaterials,
  listByProject,
  listByProjectForUser,
  createMaterial,
  createMaterialForUser,
  findById,
  findByIdForUser,
  updateMaterial,
  updateMaterialForUser,
};
