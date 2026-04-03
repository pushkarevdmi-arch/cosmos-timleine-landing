/**
 * Repair U+FFFD in data/events.json (lost UTF-8 punctuation).
 * Run: node scripts/fix-events-encoding.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "../data/events.json");

const EN = "\u2013";
const EM = "\u2014";
const LSQ = "\u201c";
const RSQ = "\u201d";
const APOS = "\u2019";
const F = "\uFFFD";

function fixString(s) {
  if (typeof s !== "string" || !s.includes(F)) return s;
  let t = s;

  // Long / unambiguous replacements first
  t = t.replace(
    `Venus ${F} Jupiter ${F}Cosmic Kiss${F} Conjunction`,
    `Venus ${EN} Jupiter ${LSQ}Cosmic Kiss${RSQ} Conjunction`
  );
  t = t.replace(`Uranus${F}Neptune`, `Uranus${EN}Neptune`);
  t = t.replace(`Comet Swift${F}Tuttle`, `Comet Swift${EN}Tuttle`);
  t = t.replace(
    `called the ${F}Fireball Years${F}`,
    `called the ${LSQ}Fireball Years${RSQ}`
  );
  t = t.replace(
    `often called ${F}parades of planets,${F}`,
    `often called ${LSQ}parades of planets,${RSQ}`
  );
  t = t.replace(`double ${F}star${F}`, `double ${LSQ}star${RSQ}`);
  t = t.replace(`orange-red ${F}star${F}`, `orange-red ${LSQ}star${RSQ}`);
  t = t.replace(`spectacular ${F}ring of fire${F}`, `spectacular ${LSQ}ring of fire${RSQ}`);
  t = t.replace(`famous ${F}Ring of Fire${F}`, `famous ${LSQ}Ring of Fire${RSQ}`);
  t = t.replace(`classic ${F}Ring of Fire${F}`, `classic ${LSQ}Ring of Fire${RSQ}`);

  // Numeric en-dash ranges
  t = t.replace(new RegExp(`(\\d+)${F}(\\d+)`, "g"), (_, a, b) => `${a}${EN}${b}`);

  // Possessives
  for (const w of ["Earth", "Moon", "Saturn", "Jupiter", "Halley", "Sun", "asteroid", "arm"]) {
    t = t.replace(new RegExp(`${w}${F}s`, "g"), `${w}${APOS}s`);
  }

  // Remaining phrase em dashes
  t = t.replace(`each other ${F} roughly`, `each other ${EM} roughly`);
  t = t.replace(`Portugal ${F} the`, `Portugal ${EM} the`);
  t = t.replace(
    `Earth ${F} closer than many satellites ${F} and`,
    `Earth ${EM} closer than many satellites ${EM} and`
  );
  t = t.replace(`surface ${F} closer`, `surface ${EM} closer`);
  t = t.replace(`months ${F} a rare`, `months ${EM} a rare`);
  t = t.replace(`rings ${F} a rare`, `rings ${EM} a rare`);
  t = t.replace(`sky ${F} a rare`, `sky ${EM} a rare`);
  t = t.replace(`Sun ${F} one`, `Sun ${EM} one`);
  t = t.replace(`rare ${F} they`, `rare ${EM} they`);
  t = t.replace(`July${F}August`, `July${EN}August`);
  t = t.replace(`2117${F}2125`, `2117${EN}2125`);

  return t;
}

function walk(o) {
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i++) {
      if (typeof o[i] === "string") o[i] = fixString(o[i]);
      else walk(o[i]);
    }
  } else if (o && typeof o === "object") {
    for (const k of Object.keys(o)) {
      if (typeof o[k] === "string") o[k] = fixString(o[k]);
      else walk(o[k]);
    }
  }
}

const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw);
walk(data);

function collectBad(o, acc) {
  if (typeof o === "string") {
    if (o.includes(F)) acc.push(o);
  } else if (Array.isArray(o)) o.forEach((x) => collectBad(x, acc));
  else if (o && typeof o === "object")
    Object.values(o).forEach((x) => collectBad(x, acc));
}
const leftover = [];
collectBad(data, leftover);
if (leftover.length) {
  console.error("Still contain U+FFFD:", leftover.length);
  for (const x of leftover) console.error(x.slice(0, 200));
  process.exit(1);
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("OK: wrote", filePath);
