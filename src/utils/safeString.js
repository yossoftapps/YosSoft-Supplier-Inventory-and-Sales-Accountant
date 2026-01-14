// Safe string conversion to avoid throwing errors when coercing complex objects
export default function safeString(v) {
  try {
    if (v === null || typeof v === 'undefined') return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') {
      if ('value' in v && typeof v.value === 'string') return v.value;
      if ('label' in v && typeof v.label === 'string') return v.label;
      if ('name' in v && typeof v.name === 'string') return v.name;
      try { return JSON.stringify(v); } catch (e) { return ''; }
    }
    return String(v);
  } catch (e) {
    return '';
  }
}
