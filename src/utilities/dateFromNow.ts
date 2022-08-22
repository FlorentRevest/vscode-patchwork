import * as dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(relativeTime, {
  thresholds: [
    { l: "s", r: 44, d: "second" },
    { l: "m", r: 89 },
    { l: "mm", r: 44, d: "minute" },
    { l: "h", r: 89 },
    { l: "hh", r: 21, d: "hour" },
    { l: "d", r: 35 },
    { l: "dd", r: 6, d: "day" },
    { l: "w", r: 7 },
    { l: "ww", r: 3, d: "week" },
    { l: "M", r: 4 },
    { l: "MM", r: 10, d: "month" },
    { l: "y", r: 17 },
    { l: "yy", d: "year" },
  ],
});

dayjs.extend(updateLocale);
dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "seconds",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    w: "a week",
    ww: "%d weeks",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years",
  },
});

// Pretty-print Dates as times from now
export function dateFromNow(date: Date): string {
  const djs = dayjs(date);

  const now = Date.now();
  djs.diff(now, "month");

  if (djs.diff(now, "month") < 1) {
    return djs.fromNow();
  } else if (djs.diff(now, "year") < 1) {
    return `on ${djs.format("MMM D")}`;
  }
  return `on ${djs.format("MMM D, YYYY")}`;
}
