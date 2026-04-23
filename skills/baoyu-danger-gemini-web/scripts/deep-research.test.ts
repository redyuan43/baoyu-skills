import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseArgs,
  parseChromeProfiles,
  pickLatestSession,
  pickProfile,
} from './deep-research.ts';

test('parseArgs supports new session, no-submit, json, and profile email', () => {
  const parsed = parseArgs([
    '--profile-email', 'ivanfeng3333@gmail.com',
    '--new-session',
    '--no-submit',
    '--json',
    '--wait-ms', '0',
    'research topic',
  ]);

  assert.equal(parsed.profileEmail, 'ivanfeng3333@gmail.com');
  assert.equal(parsed.newSession, true);
  assert.equal(parsed.noSubmit, true);
  assert.equal(parsed.json, true);
  assert.equal(parsed.waitMs, 0);
  assert.equal(parsed.prompt, 'research topic');
});

test('parseChromeProfiles and pickProfile resolve a signed-in profile by email', () => {
  const profiles = parseChromeProfiles(JSON.stringify({
    profile: {
      last_used: 'Default',
      info_cache: {
        Default: {
          name: 'Billions',
          user_name: 'redyuan43@gmail.com',
        },
        'Profile 1': {
          name: 'Feng',
          user_name: 'ivanfeng3333@gmail.com',
        },
      },
    },
  }), '/home/demo/.config/google-chrome');

  const picked = pickProfile(profiles, { profileEmail: 'ivanfeng3333@gmail.com' });
  assert.equal(picked?.profileKey, 'Profile 1');
});

test('pickLatestSession skips unsaved conversations and respects profile selectors', () => {
  const sessions = [
    {
      id: 'home',
      conversationUrl: 'https://gemini.google.com/app',
      profileEmail: 'ivanfeng3333@gmail.com',
      profileDir: '/tmp/Profile 1',
      createdAt: '2026-01-04T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z',
      messages: [],
    },
    {
      id: 'latest',
      conversationUrl: 'https://gemini.google.com/app/demo',
      profileEmail: 'ivanfeng3333@gmail.com',
      profileDir: '/tmp/Profile 1',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      messages: [],
    },
    {
      id: 'draft',
      conversationUrl: null,
      profileEmail: 'ivanfeng3333@gmail.com',
      profileDir: '/tmp/Profile 1',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
      messages: [],
    },
    {
      id: 'other',
      conversationUrl: 'https://gemini.google.com/app/other',
      profileEmail: 'other@example.com',
      profileDir: '/tmp/Profile 2',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      messages: [],
    },
  ];

  assert.equal(pickLatestSession(sessions, { profileEmail: 'ivanfeng3333@gmail.com' })?.id, 'latest');
  assert.equal(pickLatestSession(sessions, { profileEmail: 'missing@example.com' }), null);
});
