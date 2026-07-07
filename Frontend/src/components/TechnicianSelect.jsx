/** Dropdown of workshop technician names */
export default function TechnicianSelect({
  technicians = [],
  value,
  onChange,
  className = '',
  includeUnassigned = true,
  placeholder = 'Select technician',
}) {
  const names = technicians.filter((name) => typeof name === 'string' && name.trim());

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      data-lpignore="true"
      data-1p-ignore
      data-form-type="other"
      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs py-2 px-3 rounded-xl focus:border-blue-500 outline-none ${className}`}
    >
      <option value="" disabled={false}>{placeholder}</option>
      {names.map((name) => (
        <option key={name} value={name} disabled={false}>
          {name}
        </option>
      ))}
      {includeUnassigned && <option value="Unassigned" disabled={false}>Unassigned</option>}
    </select>
  );
}
