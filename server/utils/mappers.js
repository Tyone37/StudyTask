function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    authProvider: row.auth_provider || 'local',
    avatarUrl: row.avatar_url || null,
    createdAt: row.created_at
  };
}

function mapTodo(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at
  };
}

function mapNote(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content || '',
    createdAt: row.created_at
  };
}

function formatDateOnly(value) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return String(value || '').slice(0, 10);
}

function mapDeadline(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    dueDate: formatDateOnly(row.due_date),
    done: Boolean(row.done)
  };
}

module.exports = {
  mapUser,
  mapTodo,
  mapNote,
  mapDeadline
};
