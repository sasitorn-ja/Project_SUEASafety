import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore Node strip-types test runner resolves the .ts module directly.
import { fixedTeamCodeForDivision, normalizeDivisionName } from "./safety-culture-fixed-teams.ts";

test("normalizes case, whitespace, hyphens, and underscores", () => {
  assert.equal(normalizeDivisionName("  rmc_north-east  "), "RMC NORTH EAST");
});

test("maps every fixed RMC region", () => {
  assert.equal(fixedTeamCodeForDivision("RMC Metro"), "RMC_METRO");
  assert.equal(fixedTeamCodeForDivision("RMC East Area"), "RMC_EAST");
  assert.equal(fixedTeamCodeForDivision("RMC West"), "RMC_WEST");
  assert.equal(fixedTeamCodeForDivision("RMC South"), "RMC_SOUTH");
  assert.equal(fixedTeamCodeForDivision("RMC North"), "RMC_NORTH");
});

test("maps Northeast before East and North", () => {
  assert.equal(fixedTeamCodeForDivision("RMC Northeast"), "RMC_NORTHEAST");
  assert.equal(fixedTeamCodeForDivision("RMC North East"), "RMC_NORTHEAST");
  assert.equal(fixedTeamCodeForDivision("northeast operations"), "RMC_NORTHEAST");
});

test("maps Smart Structure aliases to SSB", () => {
  assert.equal(fixedTeamCodeForDivision("Smart Structure Business"), "SSB");
  assert.equal(fixedTeamCodeForDivision("Smart Structure"), "SSB");
  assert.equal(fixedTeamCodeForDivision("SSB"), "SSB");
  assert.equal(fixedTeamCodeForDivision("CPAC SSB Operations"), "SSB");
});

test("maps empty and unknown divisions to Other", () => {
  assert.equal(fixedTeamCodeForDivision(null), "OTHER");
  assert.equal(fixedTeamCodeForDivision(""), "OTHER");
  assert.equal(fixedTeamCodeForDivision("RMC Excellence"), "OTHER");
  assert.equal(fixedTeamCodeForDivision("Corporate Office"), "OTHER");
});
