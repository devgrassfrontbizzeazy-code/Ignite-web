export const CARRY_FORWARD_TYPES = Object.freeze({
  NONE: "NONE",
  ALL_UNUSED: "ALL_UNUSED",
  MAX_DAYS: "MAX_DAYS",
});

export const CARRY_FORWARD_OPTIONS = Object.freeze([
  { value: CARRY_FORWARD_TYPES.NONE, label: "No carry forward" },
  { value: CARRY_FORWARD_TYPES.ALL_UNUSED, label: "All unused days" },
  { value: CARRY_FORWARD_TYPES.MAX_DAYS, label: "Maximum number of days" },
]);

const carryForwardLabels = Object.fromEntries(
  CARRY_FORWARD_OPTIONS.map(({ value, label }) => [value, label])
);

const errorFieldLabels = {
  carry_forward_type: "Carry forward type",
  is_carry_forward: "Carry forward",
  max_carry_forward_days: "Maximum carry-forward days",
  allocation_days: "Allocation days",
  allocation_type: "Allocation type",
};

export function mapLeavePolicyPayload(data) {
  const isCarryForward = Boolean(
    data.carryForward ?? data.is_carry_forward ?? false
  );
  const carryForwardType =
    data.carryForwardType ??
    data.carry_forward_type ??
    CARRY_FORWARD_TYPES.NONE;

  if (
    isCarryForward &&
    !Object.values(CARRY_FORWARD_TYPES).includes(carryForwardType)
  ) {
    throw new Error(`Unsupported carry-forward type: ${carryForwardType}`);
  }

  const maxCarryForwardDays =
    isCarryForward && carryForwardType === CARRY_FORWARD_TYPES.MAX_DAYS
      ? data.carryForwardLimit ??
        data.max_carry_forward_days ??
        null
      : null;

  return {
    name: data.name,
    description: data.description || "",
    allocation_type:
      data.allocationType ??
      data.allocation_type ??
      "YEARLY",
    allocation_days:
      data.days !== undefined && data.days !== null && data.days !== ""
        ? Number(data.days)
        : data.allocation_days !== undefined &&
            data.allocation_days !== null &&
            data.allocation_days !== ""
          ? Number(data.allocation_days)
          : null,
    is_carry_forward: isCarryForward,
    carry_forward_type: isCarryForward
      ? carryForwardType
      : CARRY_FORWARD_TYPES.NONE,
    max_carry_forward_days:
      maxCarryForwardDays !== null && maxCarryForwardDays !== ""
        ? Number(maxCarryForwardDays)
        : null,
    allow_half_day:
      data.halfDayAllowed ??
      data.allow_half_day ??
      false,
    requires_approval:
      data.requiresApproval ??
      data.requires_approval ??
      false,
    is_paid:
      data.isPaid ??
      data.is_paid ??
      false,
  };
}

export function formatLeavePolicyApiError(error) {
  const responseData = error?.response?.data;
  if (!responseData || typeof responseData !== "object") {
    return error?.message || "Unable to save leave policy.";
  }

  if (typeof responseData.detail === "string") {
    return responseData.detail;
  }

  const messages = Object.entries(responseData).flatMap(([field, value]) => {
    const entries = Array.isArray(value) ? value : [value];
    return entries
      .filter((entry) => typeof entry === "string" && entry.trim())
      .map((entry) => {
        const label = errorFieldLabels[field] || field.replaceAll("_", " ");
        return `${label}: ${entry}`;
      });
  });

  return messages.join(" ") || "Unable to save leave policy.";
}

export function getCarryForwardLabel(type) {
  return carryForwardLabels[type] || "No carry forward";
}
