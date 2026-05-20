export function validateDocumentTitle(title) {
  const value = String(title || '').trim();
  if (!value) return 'Document title is required.';
  if (value.length > 80) return 'Document title must be 80 characters or less.';
  return null;
}

export function supportsImportFile(file) {
  if (!file) return false;
  return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');
}
