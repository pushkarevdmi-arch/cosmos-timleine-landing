import billionsOfYears from "./billions-of-years.json";
import millionsOfYears from "./millions-of-years.json";
import next10000Years from "./next-10000-years.json";
import next100Years from "./next-100-years.json";

/** Merged dataset: Next 100 Years → 10,000 → Millions → Billions (same order as filters). */
const allEvents = [
  ...next100Years,
  ...next10000Years,
  ...millionsOfYears,
  ...billionsOfYears,
];

export default allEvents;
