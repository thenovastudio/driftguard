/**
 * Detect changes between two config snapshots.
 * Returns array of { path, oldValue, newValue, type }
 */
export function detectChanges(oldConfig, newConfig, path = '') {
  const changes = [];
  
  if (oldConfig === null || oldConfig === undefined) {
    return [{ path: path || 'root', oldValue: null, newValue: newConfig, type: 'added' }];
  }
  
  if (typeof oldConfig !== typeof newConfig) {
    return [{ path: path || 'root', oldValue: oldConfig, newValue: newConfig, type: 'changed' }];
  }
  
  if (typeof oldConfig !== 'object') {
    if (oldConfig !== newConfig) {
      return [{ path: path || 'root', oldValue: oldConfig, newValue: newConfig, type: 'changed' }];
    }
    return [];
  }
  
  if (Array.isArray(oldConfig) !== Array.isArray(newConfig)) {
    return [{ path: path || 'root', oldValue: oldConfig, newValue: newConfig, type: 'changed' }];
  }
  
  if (Array.isArray(oldConfig)) {
    const maxLen = Math.max(oldConfig.length, newConfig.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = `${path}[${i}]`;
      if (i >= oldConfig.length) {
        changes.push({ path: itemPath, oldValue: null, newValue: newConfig[i], type: 'added' });
      } else if (i >= newConfig.length) {
        changes.push({ path: itemPath, oldValue: oldConfig[i], newValue: null, type: 'removed' });
      } else {
        changes.push(...detectChanges(oldConfig[i], newConfig[i], itemPath));
      }
    }
    return changes;
  }
  
  const allKeys = new Set([
    ...Object.keys(oldConfig || {}),
    ...Object.keys(newConfig || {}),
  ]);
  
  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;
    
    if (!(key in oldConfig)) {
      changes.push({ path: keyPath, oldValue: null, newValue: newConfig[key], type: 'added' });
    } else if (!(key in newConfig)) {
      changes.push({ path: keyPath, oldValue: oldConfig[key], newValue: null, type: 'removed' });
    } else {
      changes.push(...detectChanges(oldConfig[key], newConfig[key], keyPath));
    }
  }
  
  return changes;
}

/**
 * Format changes for display
 */
export function formatChanges(service, changes) {
  const lines = changes.map(c => {
    switch (c.type) {
      case 'added':
        return `  + \`${c.path}\`: ${JSON.stringify(c.newValue)}`;
      case 'removed':
        return `  - \`${c.path}\`: ${JSON.stringify(c.oldValue)}`;
      case 'changed':
        return `  ~ \`${c.path}\`: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`;
      default:
        return `  ? \`${c.path}\`: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`;
    }
  });
  
  return `*${service}* — ${changes.length} change(s) detected:\n${lines.join('\n')}`;
}
