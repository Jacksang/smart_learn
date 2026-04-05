const DEFERRED_QUESTION_STATUSES = ['deferred', 'revisited', 'resolved'];
const DEFERRED_QUESTION_STATUS_ALIASES = {
  parked: 'deferred',
};

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeNullableText(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

function normalizeDeferredQuestionStatus(value, { allowNull = false, fieldName = 'status' } = {}) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    if (allowNull) {
      return null;
    }

    throw new Error(`${fieldName} is required`);
  }

  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    if (allowNull) {
      return null;
    }

    throw new Error(`${fieldName} is required`);
  }

  const canonical = DEFERRED_QUESTION_STATUS_ALIASES[normalized] || normalized;

  if (!DEFERRED_QUESTION_STATUSES.includes(canonical)) {
    throw new Error(`Unsupported deferred question status: ${value}`);
  }

  return canonical;
}

function validateDeferredQuestionTransition(currentStatus, nextStatus) {
  const normalizedCurrent = normalizeDeferredQuestionStatus(currentStatus, {
    fieldName: 'currentStatus',
  });
  const normalizedNext = normalizeDeferredQuestionStatus(nextStatus, {
    fieldName: 'status',
  });

  if (normalizedCurrent === normalizedNext) {
    return normalizedNext;
  }

  if (normalizedCurrent === 'resolved') {
    throw new Error(`Deferred question cannot transition from ${normalizedCurrent} to ${normalizedNext}`);
  }

  if (normalizedCurrent === 'revisited' && normalizedNext === 'deferred') {
    throw new Error(`Deferred question cannot transition from ${normalizedCurrent} to ${normalizedNext}`);
  }

  return normalizedNext;
}

function buildDeferredQuestionStateUpdate({
  currentStatus,
  status,
  briefResponse,
  resolvedAt,
  now = new Date().toISOString(),
} = {}) {
  const nextStatus = validateDeferredQuestionTransition(currentStatus, status);
  const normalizedResolvedAt = normalizeNullableText(resolvedAt);
  const update = {
    status: nextStatus,
  };

  if (briefResponse !== undefined) {
    update.brief_response = normalizeNullableText(briefResponse);
  }

  if (nextStatus === 'resolved') {
    update.resolved_at = normalizedResolvedAt || now;
  } else {
    update.resolved_at = null;
  }

  return update;
}

module.exports = {
  DEFERRED_QUESTION_STATUSES,
  normalizeWhitespace,
  normalizeNullableText,
  normalizeDeferredQuestionStatus,
  validateDeferredQuestionTransition,
  buildDeferredQuestionStateUpdate,
};
