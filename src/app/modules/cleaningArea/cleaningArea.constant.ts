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
