/* Centralized configuration: default data and templates */
const DEFAULT_COURSES = [
  { name: "Ordinary Differential Equations with Modeling", code: "AMAT2101" },
  { name: "Tensor Analysis", code: "AMAT2104" },
]

const DEFAULT_INSTRUCTORS = [
  "Prof. Md Abdul Haque sir",
  "Prof. Abu Bakr PK sir",
]

const DEFAULT_ROOMS = ["417", "103"]
const DEFAULT_BUILDINGS = [
  "1st Science",
  "4th Science",
]

const DEFAULT_FORMAT_TEMPLATE = {
  dayHeader: `{day}, {date}\nTomorrow's class schedule:`,
  classLine: `{courseCode}--({startTime}-{endTime})--{instructor}--({room}-{building})`,
}

// Export constants (they're global variables in plain scripts)
/* Note: In a bundler, we'd export these. Here, we rely on global script loading order (config.js must be loaded before script.js). */
