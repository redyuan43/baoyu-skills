import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseArgs,
  parseChromeProfiles,
  pickLatestSession,
  pickProfileDirByEmail,
} from './main.ts';

test('parseArgs supports profile email, new session, image mode, and prompt', () => {
  const parsed = parseArgs([
    '--profile-email', 'ivanfeng3333@gmail.com',
    '--new-session',
    '--close-browser',
    '--image', 'out.png',
    '--json',
    'draw a cat',
  ]);

  assert.equal(parsed.profileEmail, 'ivanfeng3333@gmail.com');
  assert.equal(parsed.newSession, true);
  assert.equal(parsed.closeBrowser, true);
  assert.equal(parsed.imagePath, 'out.png');
  assert.equal(parsed.json, true);
  assert.equal(parsed.prompt, 'draw a cat');
});

test('parseChromeProfiles resolves Chrome Local State entries', () => {
  const raw = JSON.stringify({
    profile: {
      last_used: 'Profile 1',
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
  });

  const profiles = parseChromeProfiles(raw, '/home/demo/.config/google-chrome');
  assert.equal(profiles[0]?.profileKey, 'Profile 1');
  assert.equal(profiles[0]?.email, 'ivanfeng3333@gmail.com');
  assert.equal(pickProfileDirByEmail(profiles, 'redyuan43@gmail.com'), '/home/demo/.config/google-chrome/Default');
});

test('pickLatestSession isolates text and image modes and profile selectors', () => {
  const sessions = [
    {
      id: 'image-new',
      metadata: [null, null, null],
      profileEmail: 'ivanfeng3333@gmail.com',
      profileDir: '/tmp/Profile 1',
      mode: 'image' as const,
      messages: [],
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'text-new',
      metadata: [null, null, null],
      profileEmail: 'ivanfeng3333@gmail.com',
      profileDir: '/tmp/Profile 1',
      mode: 'text' as const,
      messages: [],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'text-other',
      metadata: [null, null, null],
      profileEmail: 'other@example.com',
      profileDir: '/tmp/Profile 2',
      mode: 'text' as const,
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  assert.equal(pickLatestSession(sessions, { mode: 'image', profileEmail: 'ivanfeng3333@gmail.com' })?.id, 'image-new');
  assert.equal(pickLatestSession(sessions, { mode: 'text', profileEmail: 'ivanfeng3333@gmail.com' })?.id, 'text-new');
  assert.equal(pickLatestSession(sessions, { mode: 'text', profileEmail: 'missing@example.com' }), null);
});
