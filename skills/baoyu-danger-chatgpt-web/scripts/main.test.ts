import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  __testAssertSessionRecord,
  parseArgs,
  parseChromeProfiles,
  pickProfile,
} from "./main.ts";

test("parseArgs supports prompt, profile, login, and session options", () => {
  const parsed = parseArgs([
    "--profile-email", "redyuan43@gmail.com",
    "--sessionId", "demo-1",
    "--json",
    "hello world",
  ]);

  assert.equal(parsed.profileEmail, "redyuan43@gmail.com");
  assert.equal(parsed.sessionId, "demo-1");
  assert.equal(parsed.json, true);
  assert.equal(parsed.prompt, "hello world");
});

test("parseChromeProfiles maps Local State info_cache into profile descriptors", () => {
  const raw = JSON.stringify({
    profile: {
      last_used: "Default",
      info_cache: {
        Default: {
          name: "Billions",
          user_name: "redyuan43@gmail.com",
        },
        "Profile 1": {
          name: "Feng",
          user_name: "ivanfeng3333@gmail.com",
        },
      },
    },
  });

  const profiles = parseChromeProfiles(raw, "/home/demo/.config/google-chrome");
  assert.equal(profiles.length, 2);
  assert.equal(profiles[0]?.profileKey, "Default");
  assert.equal(profiles[0]?.email, "redyuan43@gmail.com");
  assert.equal(profiles[0]?.isLastUsed, true);
  assert.equal(profiles[1]?.profileDir, "/home/demo/.config/google-chrome/Profile 1");
});

test("pickProfile resolves by email and by explicit directory", () => {
  const profiles = [
    {
      profileKey: "Default",
      profileDir: "/home/demo/.config/google-chrome/Default",
      name: "Billions",
      email: "redyuan43@gmail.com",
      isLastUsed: true,
      isSignedIn: true,
    },
    {
      profileKey: "Profile 1",
      profileDir: "/home/demo/.config/google-chrome/Profile 1",
      name: "Feng",
      email: "ivanfeng3333@gmail.com",
      isLastUsed: false,
      isSignedIn: true,
    },
  ];

  const byEmail = pickProfile(profiles, { profileEmail: "ivanfeng3333@gmail.com" });
  assert.equal(byEmail.profileKey, "Profile 1");

  const byDir = pickProfile(profiles, { profileDir: "/home/demo/.config/google-chrome/Default" });
  assert.equal(byDir.email, "redyuan43@gmail.com");
});

test("pickProfile returns a synthetic explicit directory when discovery is unavailable", () => {
  const profile = pickProfile([], { profileDir: "/tmp/custom/Profile 7" });
  assert.equal(profile.profileKey, "Profile 7");
  assert.equal(profile.profileDir, path.resolve("/tmp/custom/Profile 7"));
  assert.equal(profile.isSignedIn, false);
});

test("session record helper accepts well-shaped records", () => {
  __testAssertSessionRecord({
    id: "demo",
    profileDir: "/tmp/profile",
    profileEmail: "demo@example.com",
    conversationUrl: "https://chatgpt.com/c/demo",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

test("pickProfile prefers the only signed-in profile when no explicit selector is given", () => {
  const profile = pickProfile([
    {
      profileKey: "Default",
      profileDir: "/tmp/Default",
      name: "Default",
      email: null,
      isLastUsed: false,
      isSignedIn: false,
    },
    {
      profileKey: "Profile 1",
      profileDir: "/tmp/Profile 1",
      name: "Profile 1",
      email: "only@example.com",
      isLastUsed: false,
      isSignedIn: true,
    },
  ], {});

  assert.equal(profile.profileKey, "Profile 1");
});
