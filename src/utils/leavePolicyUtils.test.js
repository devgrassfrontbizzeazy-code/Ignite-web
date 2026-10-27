import assert from "node:assert/strict";
import test from "node:test";

import {
  CARRY_FORWARD_OPTIONS,
  CARRY_FORWARD_TYPES,
  formatLeavePolicyApiError,
  mapLeavePolicyPayload,
} from "./leavePolicyUtils.js";

test("carry-forward options use the backend enum values", () => {
  assert.deepEqual(
    CARRY_FORWARD_OPTIONS.map(({ value }) => value),
    ["NONE", "ALL_UNUSED", "MAX_DAYS"]
  );
});

test("disabled carry forward sends NONE and clears the maximum", () => {
  const payload = mapLeavePolicyPayload({
    name: "Casual Leave",
    allocationType: "MONTHLY",
    days: "1.5",
    carryForward: false,
    carryForwardType: CARRY_FORWARD_TYPES.MAX_DAYS,
    carryForwardLimit: "1",
  });

  assert.equal(payload.allocation_type, "MONTHLY");
  assert.equal(payload.allocation_days, 1.5);
  assert.equal(payload.is_carry_forward, false);
  assert.equal(payload.carry_forward_type, "NONE");
  assert.equal(payload.max_carry_forward_days, null);
});

test("MAX_DAYS sends the exact enum and numeric maximum", () => {
  const payload = mapLeavePolicyPayload({
    name: "Earned Leave",
    carryForward: true,
    carryForwardType: CARRY_FORWARD_TYPES.MAX_DAYS,
    carryForwardLimit: "5",
  });

  assert.equal(payload.carry_forward_type, "MAX_DAYS");
  assert.equal(payload.max_carry_forward_days, 5);
});

test("ALL_UNUSED sends the exact enum without a maximum", () => {
  const payload = mapLeavePolicyPayload({
    name: "Sick Leave",
    carryForward: true,
    carryForwardType: CARRY_FORWARD_TYPES.ALL_UNUSED,
    carryForwardLimit: "5",
  });

  assert.equal(payload.carry_forward_type, "ALL_UNUSED");
  assert.equal(payload.max_carry_forward_days, null);
});

test("unsupported carry-forward values are rejected before creating a request", () => {
  assert.throws(
    () =>
      mapLeavePolicyPayload({
        name: "Invalid Leave",
        carryForward: true,
        carryForwardType: "ALL",
      }),
    /Unsupported carry-forward type: ALL/
  );
});

test("backend carry-forward validation errors are presented with a field label", () => {
  assert.equal(
    formatLeavePolicyApiError({
      response: {
        data: {
          carry_forward_type: ['"ALL" is not a valid choice.'],
        },
      },
    }),
    'Carry forward type: "ALL" is not a valid choice.'
  );
});
