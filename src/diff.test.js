import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectChanges, formatChanges } from './diff.js';

describe('detectChanges', () => {
  it('detects added fields', () => {
    const old = { a: 1 };
    const now = { a: 1, b: 2 };
    const changes = detectChanges(old, now);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, 'added');
    assert.equal(changes[0].path, 'b');
  });

  it('detects removed fields', () => {
    const old = { a: 1, b: 2 };
    const now = { a: 1 };
    const changes = detectChanges(old, now);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, 'removed');
  });

  it('detects changed values', () => {
    const old = { a: 1 };
    const now = { a: 99 };
    const changes = detectChanges(old, now);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, 'changed');
    assert.equal(changes[0].oldValue, 1);
    assert.equal(changes[0].newValue, 99);
  });

  it('detects nested changes', () => {
    const old = { account: { settings: { branding: { logo: 'old.png' } } } };
    const now = { account: { settings: { branding: { logo: 'new.png' } } } };
    const changes = detectChanges(old, now);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].path, 'account.settings.branding.logo');
  });

  it('returns empty for identical configs', () => {
    const config = { a: 1, b: { c: 2 } };
    assert.equal(detectChanges(config, config).length, 0);
  });

  it('detects array changes', () => {
    const old = { items: [1, 2, 3] };
    const now = { items: [1, 2, 4] };
    const changes = detectChanges(old, now);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].path, 'items[2]');
  });
});

describe('formatChanges', () => {
  it('formats for Slack display', () => {
    const changes = [
      { path: 'account.email', oldValue: 'old@test.com', newValue: 'new@test.com', type: 'changed' },
    ];
    const formatted = formatChanges('stripe', changes);
    assert.ok(formatted.includes('stripe'));
    assert.ok(formatted.includes('account.email'));
  });
});
