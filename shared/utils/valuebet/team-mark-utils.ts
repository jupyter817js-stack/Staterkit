import teamMarkMapData from "@/shared/data/team-mark-map.json";

type TeamMarkEntry = { team: string; path: string };
const TEAM_MARK_ENTRIES = teamMarkMapData as TeamMarkEntry[];

function normalize(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/&/g, " and ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stripSuffix(s: string): string {
  return s.replace(/\s+(fc|cf|sc|ac|ud|jk|fk|if|bk|ff|sv|as|aj|ogc|losc|rc|rnk|hnk|nk|gnk|bsc|cfc|sporting|calcio|club|gfs)\s*$/gi, "").trim();
}

const TRANSLIT_VARIANTS: [RegExp, string][] = [
  [/ai/g, "e"],
  [/oi/g, "i"],
  [/ou/g, "u"],
  [/ph/g, "f"],
  [/ck/g, "k"],
];

const TEAM_ALIASES: Record<string, string> = {
  psg: "Paris Saint-Germain",
  barca: "FC Barcelona",
  barcelona: "FC Barcelona",
  inter: "Inter Milan",
  atleti: "Atlético de Madrid",
  "atletico madrid": "Atlético de Madrid",
  atletico: "Atlético de Madrid",
  juve: "Juventus FC",
  juventus: "Juventus FC",
  "man city": "Manchester City",
  "man united": "Manchester United",
  "man utd": "Manchester United",
  spurs: "Tottenham Hotspur",
  "real madrid": "Real Madrid",
  bayern: "Bayern Munich",
  dortmund: "Borussia Dortmund",
  ajax: "Ajax Amsterdam",
  benfica: "SL Benfica",
  panaitolikos: "Panetolikos GFS",
  "panaitolikos gfs": "Panetolikos GFS",
  "asteras tripolis": "Asteras Aktor",
  larissa: "AE Larisa",
};

const NORMALIZED_MAP = new Map<string, string>();

function buildMap() {
  if (NORMALIZED_MAP.size > 0) return;
  for (const { team, path } of TEAM_MARK_ENTRIES) {
    const n = normalize(team);
    if (n) NORMALIZED_MAP.set(n, path);
    const stripped = stripSuffix(n);
    if (stripped && stripped !== n) NORMALIZED_MAP.set(stripped, path);
  }
}

export function getTeamMarkUrl(teamName: string): string | null {
  if (!teamName || typeof teamName !== "string") return null;
  buildMap();
  let n = normalize(teamName);
  if (!n) return null;
  const aliased = TEAM_ALIASES[n] ?? TEAM_ALIASES[stripSuffix(n)];
  if (aliased) n = normalize(aliased);
  const exact = NORMALIZED_MAP.get(n);
  if (exact) return exact;
  const stripped = stripSuffix(n);
  const strippedMatch = NORMALIZED_MAP.get(stripped);
  if (strippedMatch) return strippedMatch;
  if (n.length >= 3) {
    let best: string | null = null;
    let bestKeyLen = 0;
    for (const [key, path] of NORMALIZED_MAP) {
      if (key.startsWith(n) || n.startsWith(key)) {
        if (key.length > bestKeyLen) {
          best = path;
          bestKeyLen = key.length;
        }
      }
    }
    if (best) return best;
  }
  if (n.length >= 5) {
    let best: string | null = null;
    let bestKeyLen = 999;
    for (const [key, path] of NORMALIZED_MAP) {
      if (key.includes(n)) {
        if (key.length < bestKeyLen) {
          best = path;
          bestKeyLen = key.length;
        }
      }
    }
    if (best) return best;
  }
  const candidates = [n];
  for (const [regex, replacement] of TRANSLIT_VARIANTS) {
    const variant = n.replace(regex, replacement);
    if (variant !== n) candidates.push(variant);
  }
  for (const candidate of candidates) {
    const exactMatch = NORMALIZED_MAP.get(candidate);
    if (exactMatch) return exactMatch;
    const str = stripSuffix(candidate);
    const strMatch = NORMALIZED_MAP.get(str);
    if (strMatch) return strMatch;
    if (candidate.length >= 5) {
      for (const [key, path] of NORMALIZED_MAP) {
        if (key.includes(candidate) || key.startsWith(candidate) || candidate.startsWith(key)) return path;
      }
    }
  }
  return null;
}
