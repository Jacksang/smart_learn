const SESSION_MODES = ['learn', 'review', 'quiz', 'reinforce'];

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeSessionMode(value, { allowNull = false, fieldName = 'mode' } = {}) {
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

  if (!SESSION_MODES.includes(normalized)) {
    throw new Error(`Unsupported session mode: ${value}`);
  }

  return normalized;
}

function normalizeCurrentTopicId(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function readModeInput(input = {}) {
  if (hasOwn(input, 'mode')) {
    return {
      present: true,
      value: input.mode,
      fieldName: 'mode',
    };
  }

  if (hasOwn(input, 'currentMode')) {
    return {
      present: true,
      value: input.currentMode,
      fieldName: 'currentMode',
    };
  }

  if (hasOwn(input, 'current_mode')) {
    return {
      present: true,
      value: input.current_mode,
      fieldName: 'current_mode',
    };
  }

  return {
    present: false,
    value: undefined,
    fieldName: 'mode',
  };
}

function readTopicInput(input = {}) {
  if (hasOwn(input, 'currentOutlineItemId')) {
    return input.currentOutlineItemId;
  }

  if (hasOwn(input, 'current_outline_item_id')) {
    return input.current_outline_item_id;
  }

  if (hasOwn(input, 'currentTopicId')) {
    return input.currentTopicId;
  }

  if (hasOwn(input, 'current_topic_id')) {
    return input.current_topic_id;
  }

  return undefined;
}

function buildSessionStateUpdates(input = {}) {
  const updates = {};
  const modeInput = readModeInput(input);
  const topicInput = readTopicInput(input);

  if (modeInput.present) {
    updates.mode = normalizeSessionMode(modeInput.value, {
      fieldName: modeInput.fieldName,
    });
  }

  if (topicInput !== undefined) {
    updates.current_outline_item_id = normalizeCurrentTopicId(topicInput);
  }

  return updates;
}

function mapSessionState(session) {
  if (!session) {
    return null;
  }

  return {
    ...session,
    mode: normalizeSessionMode(session.mode),
    currentTopicId: normalizeCurrentTopicId(session.currentTopicId ?? session.currentOutlineItemId),
    currentOutlineItemId: normalizeCurrentTopicId(session.currentOutlineItemId ?? session.currentTopicId),
  };
}

module.exports = {
  SESSION_MODES,
  normalizeWhitespace,
  normalizeSessionMode,
  normalizeCurrentTopicId,
  buildSessionStateUpdates,
  mapSessionState,
};
