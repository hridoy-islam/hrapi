import moment from "moment-timezone";

export const CleaningAreaSearchableFields = ["areaName", "roomNumber"];

export const CLEANING_TYPES = ["daily", "monthly"] as const;

// A daily area is done once a day, a monthly area once a month, counted
// on the UK clock
export const cleaningPeriod = (
  type: string,
  date: Date | string = new Date(),
) => {
  const unit = type === "monthly" ? "month" : "day";
  const ref = moment(date).tz("Europe/London");
  return {
    $gte: ref.clone().startOf(unit).toDate(),
    $lte: ref.clone().endOf(unit).toDate(),
  };
};

// One key per area per period, e.g. 2026-10-12 (daily) or 2026-10 (monthly).
// Backs the unique index that stops two people taking the same area at once.
export const cleaningPeriodKey = (
  type: string,
  date: Date | string = new Date(),
) =>
  moment(date)
    .tz("Europe/London")
    .format(type === "monthly" ? "YYYY-MM" : "YYYY-MM-DD");

// A log moves in_progress <-> paused -> stopped -> completed. Every state but
// completed is a session still being worked on.
export const OPEN_LOG_STATUSES = ["in_progress", "paused", "stopped"] as const;
export const CLEANING_LOG_STATUSES = [...OPEN_LOG_STATUSES, "completed"] as const;

// Logs saved before sessions existed carry no status and count as completed
export const COMPLETED_LOG_FILTER = {
  status: { $nin: [...OPEN_LOG_STATUSES] },
};
