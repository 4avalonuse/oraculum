import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceService } from '../src/oraculum/application/workspace/workspace-service.js';
import { createWorkspaceRepository } from '../src/oraculum/application/workspace/workspace-repository.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); }
  };
}

test('workspace service persists and reloads workspaces', () => {
  const repository = createWorkspaceRepository(memoryStorage());
  const service = createWorkspaceService(repository);

  service.create({ id: 'btc-lab', name: 'BTC Lab', assetIds: ['btcusd'] });

  const loaded = service.load('btc-lab');

  assert.deepEqual(loaded, {
    id: 'btc-lab',
    name: 'BTC Lab',
    assetIds: ['btcusd'],
    frameIds: [],
    timelineIds: [],
    hypothesisIds: [],
    metadata: {}
  });
});

test('workspace repository survives service recreation with the same storage', () => {
  const storage = memoryStorage();

  createWorkspaceService(createWorkspaceRepository(storage))
    .create({ id: 'lab', name: 'Investigation' });

  const second = createWorkspaceService(createWorkspaceRepository(storage));

  assert.equal(second.load('lab').name, 'Investigation');
  assert.equal(second.list().length, 1);
});

test('workspace repository removes a workspace', () => {
  const repository = createWorkspaceRepository(memoryStorage());
  const service = createWorkspaceService(repository);

  service.create({ id: 'lab', name: 'Investigation' });
  assert.equal(service.remove('lab'), true);
  assert.equal(service.load('lab'), null);
});
