function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Shows who created/edited/deleted a record — visible to admins on forms and lists */
export default function AuditInfo({ record, showDeleted = true, className = '' }) {
  if (!record) return null;
  const parts = [];
  if (record.createdBy) {
    parts.push(`Added by ${record.createdBy}${record.createdAt ? ` · ${formatWhen(record.createdAt)}` : ''}`);
  }
  if (record.updatedBy && record.updatedBy !== record.createdBy) {
    parts.push(`Edited by ${record.updatedBy}${record.updatedAt ? ` · ${formatWhen(record.updatedAt)}` : ''}`);
  } else if (record.updatedBy && record.updatedAt && record.updatedAt !== record.createdAt) {
    parts.push(`Last edit by ${record.updatedBy} · ${formatWhen(record.updatedAt)}`);
  }
  if (showDeleted && record.isDeleted && record.deletedBy) {
    parts.push(`Deleted by ${record.deletedBy}${record.deletedAt ? ` · ${formatWhen(record.deletedAt)}` : ''}`);
  }
  if (parts.length === 0) return null;
  return (
    <div className={`text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 ${className}`}>
      {parts.map((line) => (
        <p key={line} className={record.isDeleted ? 'text-rose-500 dark:text-rose-400' : ''}>
          {record.isDeleted && line.startsWith('Deleted') ? '🗑 ' : '👤 '}
          {line}
        </p>
      ))}
    </div>
  );
}
