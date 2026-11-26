import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRun, toMeta, toProjects } from '../src/lib/contracts.ts';

const api = (over = {}, result = {}) => ({
  id: 'a', parent_id: null, message: 'make calc', created_at: '2026-11-23T10:00:00',
  result: { answer: 'done', plan: '1. add', review: 'APPROVED', approved: true, attempts: 1, files: { 'calc.py': 'x = 1' }, ...result },
  ...over,
});

test('parses the FastAPI run shape and rejects anything else', () => {
  assert.deepEqual(parseRun(api()), {
    id: 'a', parentId: null, message: 'make calc', createdAt: '2026-11-23T10:00:00',
    answer: 'done', plan: '1. add', review: 'APPROVED', approved: true, attempts: 1, files: { 'calc.py': 'x = 1' },
  });
  for (const bad of [null, [], api({ id: 1 }), api({ parent_id: 5 }), api({ result: null }),
    api({}, { approved: 'yes' }), api({}, { files: { 'a.py': 1 } }), api({}, { files: [] })]) {
    assert.throws(() => parseRun(bad));
  }
});

test('groups revisions into projects by following parent_id', () => {
  const meta = (id, parentId, createdAt) => toMeta(parseRun(api({ id, parent_id: parentId, created_at: createdAt, message: `run ${id}` })));
  const projects = toProjects([
    meta('b', 'a', '2026-11-23T10:05'), meta('a', null, '2026-11-23T10:00'),
    meta('c', 'b', '2026-11-23T10:09'), meta('x', null, '2026-11-23T09:00'),
    meta('orphan', 'gone', '2026-11-23T08:00'),   // parent not in this browser: becomes its own root
  ]);
  assert.deepEqual(projects.map((p) => [p.rootId, p.versions.map((v) => v.id)]),
    [['a', ['a', 'b', 'c']], ['x', ['x']], ['orphan', ['orphan']]]);
  assert.equal(projects[0].title, 'run a');
});
