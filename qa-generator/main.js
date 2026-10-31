/* Q&A Generator for Obsidian — bundled with esbuild */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => QAGeneratorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/nlp.ts
var STOPWORDS = new Set(
  "a about above after again against all also am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's however i i'd i'll i'm i've if in into is isn't it it's its itself just let's like many may me might more most must mustn't my myself no nor not now of off often on once one only or other ought our ours ourselves out over own same shall she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through thus to too under until up upon us use used uses using very via was wasn't we we'd we'll we're we've well were weren't what what's when when's where where's which while who who's whom why why's will with within without won't would wouldn't yet you you'd you'll you're you've your yours yourself yourselves etc e.g i.e eg ie also usually generally typically example called known make makes made get gets got new way ways thing things lot lots much even still back first second third two three".split(/\s+/)
);
var PRONOUN_START = /^(it|this|that|these|those|they|them|he|she|we|you|i|there|here|such|its|their|his|her|our|which|what|who|one|both|each|another|other|some|many|most|all)\b/i;
var ABBREVIATIONS = [
  "e.g.",
  "i.e.",
  "etc.",
  "vs.",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Prof.",
  "Sr.",
  "Jr.",
  "St.",
  "approx.",
  "fig.",
  "Fig.",
  "No.",
  "no.",
  "vol.",
  "Vol.",
  "cf.",
  "al.",
  "Inc.",
  "Ltd.",
  "Co.",
  "U.S.",
  "U.K.",
  "a.m.",
  "p.m.",
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec."
];
function cleanInline(s) {
  return s.replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[\[([^\]|#]*)(?:#[^\]|]*)?\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]|#]*)#([^\]]+)\]\]/g, (_m, a, b) => a ? a : b).replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\[\^[^\]]+\]/g, "").replace(/<[^>]+>/g, "").replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/(^|[^\w*])\*([^*\n]+)\*(?=[^\w*]|$)/g, "$1$2").replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, "$1$2").replace(/==([^=]+)==/g, "$1").replace(/~~([^~]+)~~/g, "$1").replace(/\$([^$]+)\$/g, "$1").replace(/(^|\s)#[\w/-]+/g, "$1").replace(/\^[\w-]+\s*$/g, "").replace(/\s+/g, " ").trim();
}
function cleanForLlm(markdown) {
  return markdown.replace(/\r\n?/g, "\n").replace(/^---\n[\s\S]*?\n---\n?/, "").replace(/%%[\s\S]*?%%/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[\[([^\]|#]*)(?:#[^\]|]*)?\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
}
function splitSentences(text) {
  let t = text;
  const marker = "\0";
  for (const ab of ABBREVIATIONS) {
    t = t.split(ab).join(ab.replace(/\./g, marker));
  }
  t = t.replace(/(\d)\.(\d)/g, `$1${marker}$2`);
  const parts = t.split(/(?<=[.!?])["')\]]?\s+(?=["'(\[]?[A-Z0-9])/);
  return parts.map((p) => p.split(marker).join(".").trim()).filter((p) => p.length > 0);
}
function parseNote(markdown, title) {
  let md = markdown.replace(/\r\n?/g, "\n");
  md = md.replace(/^---\n[\s\S]*?\n---\n?/, "");
  md = md.replace(/(^|\n)(```|~~~)[\s\S]*?\n\2[^\n]*/g, "\n");
  md = md.replace(/%%[\s\S]*?%%/g, "");
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  md = md.replace(/\$\$[\s\S]*?\$\$/g, "");
  const sections = [];
  let current = newSection(title, 0);
  sections.push(current);
  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      const text = cleanInline(paragraph.join(" "));
      if (text) current.sentences.push(...splitSentences(text));
      paragraph = [];
    }
  };
  for (const rawLine of md.split("\n")) {
    let line = rawLine.replace(/\s+$/, "");
    if (/^\s*>/.test(line)) {
      line = line.replace(/^\s*(>\s?)+/, "");
      if (/^\[![\w-]+\][+-]?/.test(line)) {
        flushParagraph();
        continue;
      }
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      current = newSection(cleanInline(heading[2]), heading[1].length);
      sections.push(current);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    if (/^\s*\|/.test(line) || /^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
      flushParagraph();
      continue;
    }
    const item = /^\s*([-*+]|\d+[.)])\s+(?:\[.\]\s+)?(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const content = cleanInline(item[2]);
      if (content) {
        current.bullets.push(content);
        current.rawBullets.push(item[2]);
        if (/\d/.test(item[1])) current.ordered = true;
      }
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  const nonEmpty = sections.filter((s) => s.sentences.length || s.bullets.length);
  const plainText = nonEmpty.map((s) => [s.heading, ...s.sentences, ...s.bullets].join("\n")).join("\n\n");
  return { title, sections: nonEmpty, plainText };
}
function newSection(heading, level) {
  return { heading, level, sentences: [], bullets: [], ordered: false, rawBullets: [] };
}
function tokenize(s) {
  return (s.toLowerCase().match(/[a-z][a-z'-]*[a-z]|[a-z]/g) || []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w)
  );
}
function stem(w) {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}
var KeywordModel = class {
  constructor(note) {
    this.tf = /* @__PURE__ */ new Map();
    this.max = 1;
    const add = (text, weight) => {
      for (const w of tokenize(text)) {
        const k = stem(w);
        this.tf.set(k, (this.tf.get(k) || 0) + weight);
      }
    };
    add(note.title, 3);
    for (const s of note.sections) {
      add(s.heading, 2);
      s.sentences.forEach((x) => add(x, 1));
      s.bullets.forEach((x) => add(x, 1));
    }
    this.max = Math.max(1, ...Array.from(this.tf.values()));
  }
  weight(word) {
    return (this.tf.get(stem(word.toLowerCase())) || 0) / this.max;
  }
  sentenceScore(sentence) {
    const toks = tokenize(sentence);
    if (!toks.length) return 0;
    const uniq = Array.from(new Set(toks.map(stem)));
    const sum = uniq.reduce((acc, w) => acc + (this.tf.get(w) || 0) / this.max, 0);
    return sum / Math.sqrt(toks.length);
  }
  /** Best single keyword in a sentence (for cloze). */
  bestKeyword(sentence) {
    const words = sentence.match(/[A-Za-z][A-Za-z'-]*[A-Za-z]/g) || [];
    let best = null;
    let bestW = 0;
    for (const w of words) {
      if (w.length < 4 || STOPWORDS.has(w.toLowerCase())) continue;
      const wt = this.weight(w) + (/^[A-Z]/.test(w) ? 0.05 : 0) + w.length / 200;
      if (wt > bestW) {
        bestW = wt;
        best = w;
      }
    }
    return best;
  }
};
var wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
var capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
var ensurePeriod = (s) => /[.!?:]$/.test(s) ? s : s + ".";
var trimPunct = (s) => s.replace(/^[\s,;:—–-]+|[\s,;:.!?—–-]+$/g, "");
var lowerSeen = /* @__PURE__ */ new Set();
var properSeen = /* @__PURE__ */ new Set();
function decapitalize(s) {
  return s.replace(/^([A-Z][a-z'-]+)\b/, (m) => properSeen.has(m) ? m : m.toLowerCase());
}
function lowerFirstIfCommon(s) {
  if (/^[A-Z][a-z'-]*\s+[A-Z]/.test(s) && !/^(The|A|An)\s/.test(s)) return s;
  return s.replace(
    /^([A-Z][a-z'-]*)\b/,
    (m) => /^(The|A|An)$/.test(m) || lowerSeen.has(m.toLowerCase()) && !properSeen.has(m) ? m.toLowerCase() : m
  );
}
var DEF_VERBS = [
  { re: /^(.+?)\s+(?:is|are) defined as\s+(.+)$/i, q: (s) => `How is ${s} defined?`, strict: false },
  { re: /^(.+?)\s+(?:is|are) known as\s+(.+)$/i, q: (s) => `What is ${s} known as?`, strict: false },
  { re: /^(.+?)\s+(?:is|are) called\s+(.+)$/i, q: (s) => `What is ${s} called?`, strict: false },
  { re: /^(.+?)\s+refers? to\s+(.+)$/i, q: (s) => `What does ${s} refer to?`, strict: false },
  { re: /^(.+?)\s+means\s+(.+)$/i, q: (s) => `What does ${s} mean?`, strict: false },
  { re: /^(.+?)\s+denotes\s+(.+)$/i, q: (s) => `What does ${s} denote?`, strict: false },
  { re: /^(.+?)\s+represents\s+(.+)$/i, q: (s) => `What does ${s} represent?`, strict: false },
  { re: /^(.+?)\s+consists? of\s+(.+)$/i, q: (s) => `What does ${s} consist of?`, strict: false },
  { re: /^(.+?)\s+(?:is|are) responsible for\s+(.+)$/i, q: (s) => `What ${/\bare\b/.test(s) ? "are" : "is"} ${s} responsible for?`, strict: false },
  { re: /^(.+?)\s+(is)\s+(.+)$/i, q: (s) => `What is ${s}?`, strict: true },
  { re: /^(.+?)\s+(are)\s+(.+)$/i, q: (s) => `What are ${s}?`, strict: true },
  { re: /^(.+?)\s+(was)\s+(.+)$/i, q: (s) => `What was ${s}?`, strict: true },
  { re: /^(.+?)\s+(were)\s+(.+)$/i, q: (s) => `What were ${s}?`, strict: true }
];
var DEF_PREDICATE = /^(a|an|the|one|any|two|three|several|many|used|known|called|responsible|considered|described|defined|essentially|basically|typically|usually|often|commonly|generally|primarily|mainly|simply|also)\b/i;
function definitionQuestion(sentence) {
  const s = trimPunct(sentence);
  if (wordCount(s) < 5 || wordCount(s) > 45 || s.includes("?")) return null;
  for (const v of DEF_VERBS) {
    const m = v.re.exec(s);
    if (!m) continue;
    const subject = trimPunct(m[1]);
    const predicate = m[m.length - 1];
    const n = wordCount(subject);
    if (n < 1 || n > (v.strict ? 5 : 7)) continue;
    if (PRONOUN_START.test(subject)) continue;
    if (/[,;:()]/.test(subject) || /\b(and|or|if|when|while|because|but|not)\b/i.test(subject)) continue;
    if (wordCount(predicate) < 3) continue;
    if (v.strict) {
      const plural = /^(are|were)$/i.test(m[2]);
      if (!plural && !DEF_PREDICATE.test(predicate)) continue;
      if (/^(not|very|so|too|more|less|quite|rather)\b/i.test(predicate)) continue;
    }
    return { q: v.q(lowerFirstIfCommon(subject)), subject };
  }
  return null;
}
function causeQuestion(sentence) {
  const s = trimPunct(sentence);
  let m = /^(.+?),?\s+because\s+(?:of\s+)?(.+)$/i.exec(s);
  if (m && wordCount(m[1]) >= 4 && wordCount(m[2]) >= 2 && !PRONOUN_START.test(m[1])) {
    return {
      q: `Why is it that ${decapitalize(trimPunct(m[1]))}?`,
      a: `Because ${decapitalize(ensurePeriod(trimPunct(m[2])))}`
    };
  }
  m = /^(.+?),?\s+(?:due to|as a result of|caused by)\s+(.+)$/i.exec(s);
  if (m && wordCount(m[1]) >= 4 && wordCount(m[2]) >= 2 && !PRONOUN_START.test(m[1])) {
    return {
      q: `What is the cause of the following: \u201C${trimPunct(m[1])}\u201D?`,
      a: ensurePeriod(capFirst(trimPunct(m[2])))
    };
  }
  m = /^(.+?)[,;]\s*(?:therefore|thus|hence|so|consequently)\s*,?\s+(.+)$/i.exec(s);
  if (m && wordCount(m[1]) >= 3 && wordCount(m[2]) >= 4 && !PRONOUN_START.test(m[2])) {
    return {
      q: `Why is it that ${decapitalize(trimPunct(m[2]))}?`,
      a: `Because ${decapitalize(ensurePeriod(trimPunct(m[1])))}`
    };
  }
  return null;
}
function termBullet(raw, clean) {
  let m = /^\s*(?:\*\*|__)(.+?)(?:\*\*|__)\s*(?:[:—–-]+|\s+is\s+|\s+are\s+)?\s*(.+)$/.exec(raw);
  if (m && wordCount(cleanInline(m[2])) >= 2) {
    return { term: cleanInline(m[1]).replace(/[:]$/, ""), desc: cleanInline(m[2]) };
  }
  m = /^([^:—–]{1,60}?)\s*(?::|\s[—–-]\s)\s*(.+)$/.exec(clean);
  if (m && wordCount(m[1]) <= 5 && wordCount(m[2]) >= 2 && !PRONOUN_START.test(m[1])) {
    return { term: m[1].trim(), desc: m[2].trim() };
  }
  return null;
}
function clozeTarget(sentence, kw) {
  const num = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{3,4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{3,4}|\d{3,4}\s?(?:BC|BCE|AD|CE)|\d+(?:[.,]\d+)?\s?(?:%|percent|km|kg|m|cm|mm|g|mg|ml|l|°C|°F|K|years?|days?|hours?|minutes?|seconds?|million|billion|thousand)|1[0-9]{3}|20[0-9]{2})\b/.exec(
    sentence
  );
  if (num) return { target: num[1], type: "fact" };
  const proper = /(?<=\s)((?:[A-Z][a-z]+|[A-Z]{2,})(?:\s+(?:of|de|the|and)?\s*(?:[A-Z][a-z]+|[A-Z]{2,}))+)/.exec(sentence);
  if (proper && wordCount(proper[1]) <= 5) return { target: proper[1].trim(), type: "cloze" };
  const k = kw.bestKeyword(sentence);
  if (k && kw.weight(k) > 0) return { target: k, type: "cloze" };
  return null;
}
var TYPE_WEIGHT = {
  definition: 1.6,
  term: 1.5,
  steps: 1.4,
  cause: 1.35,
  list: 1.2,
  fact: 1.1,
  summary: 0.8,
  cloze: 0.9,
  ai: 1
};
function generateWithNlp(markdown, title, opts) {
  const note = parseNote(markdown, title);
  const kw = new KeywordModel(note);
  properSeen = new Set(note.plainText.match(/(?<=[a-z,;] )[A-Z][a-z'-]+/g) || []);
  const proseOnly = markdown.replace(/(```|~~~)[\s\S]*?\1/g, " ").replace(/`[^`]*`/g, " ").replace(/^\s*\|.*$/gm, " ");
  lowerSeen = new Set(proseOnly.match(/(?<![.!?]\s|^)\b[a-z][a-z'-]+/gm) || []);
  const cands = [];
  let order = 0;
  for (const sec of note.sections) {
    const topic = sec.level > 0 ? sec.heading : "";
    const headingBoost = topic ? 0.1 : 0;
    const terms = [];
    sec.bullets.forEach((b, i) => {
      const t = termBullet(sec.rawBullets[i], b);
      if (t) {
        terms.push(t);
        cands.push({
          question: `What is meant by \u201C${t.term}\u201D?`,
          answer: ensurePeriod(capFirst(t.desc)),
          type: "term",
          score: 0.6 + kw.weight(t.term) + headingBoost,
          section: topic || void 0,
          key: "b:" + b,
          order: order++
        });
      } else {
        const d = definitionQuestion(b);
        if (d) {
          cands.push({
            question: d.q,
            answer: ensurePeriod(capFirst(b)),
            type: "definition",
            score: 0.6 + kw.weight(d.subject) + headingBoost,
            section: topic || void 0,
            key: "b:" + b,
            order: order++
          });
        }
      }
    });
    if (topic && sec.bullets.length >= 2) {
      const items = sec.bullets.slice(0, 12);
      if (sec.ordered) {
        cands.push({
          question: `What are the steps of \u201C${topic}\u201D, in order?`,
          answer: items.map((b, i) => `${i + 1}. ${b}`).join("\n"),
          type: "steps",
          score: 0.9 + kw.sentenceScore(topic),
          section: topic,
          key: "list:" + topic,
          order: order++
        });
      } else if (terms.length >= 2 && terms.length >= sec.bullets.length / 2) {
        cands.push({
          question: `Which terms are covered under \u201C${topic}\u201D?`,
          answer: terms.slice(0, 12).map((t) => `- ${t.term}`).join("\n"),
          type: "list",
          score: 0.7 + kw.sentenceScore(topic),
          section: topic,
          key: "list:" + topic,
          order: order++
        });
      } else {
        cands.push({
          question: `List the main points about \u201C${topic}\u201D.`,
          answer: items.map((b) => `- ${b}`).join("\n"),
          type: "list",
          score: 0.75 + kw.sentenceScore(topic),
          section: topic,
          key: "list:" + topic,
          order: order++
        });
      }
    }
    const scored = sec.sentences.map((s) => ({ s, score: kw.sentenceScore(s) }));
    for (const { s, score } of scored) {
      const words = wordCount(s);
      if (words < 4) continue;
      const d = definitionQuestion(s);
      if (d) {
        cands.push({
          question: d.q,
          answer: ensurePeriod(capFirst(s)),
          type: "definition",
          score: 0.5 + score + kw.weight(d.subject) + headingBoost,
          section: topic || void 0,
          key: "s:" + s,
          order: order++
        });
      }
      const c = causeQuestion(s);
      if (c) {
        cands.push({
          question: c.q,
          answer: c.a,
          type: "cause",
          score: 0.4 + score + headingBoost,
          section: topic || void 0,
          key: "s:" + s,
          order: order++
        });
      }
      if (opts.includeCloze && words >= 6 && words <= 40 && !PRONOUN_START.test(s)) {
        const t = clozeTarget(s, kw);
        if (t) {
          const idx = s.indexOf(t.target);
          const blanked = s.slice(0, idx) + "_____" + s.slice(idx + t.target.length);
          cands.push({
            question: `Fill in the blank: ${ensurePeriod(blanked)}`,
            answer: t.target,
            type: t.type,
            score: score + (t.type === "fact" ? 0.15 : 0),
            section: topic || void 0,
            key: "s:" + s,
            order: order++
          });
        }
      }
    }
    if (opts.includeSummaries && topic && sec.sentences.length >= 2) {
      const top = scored.map((x, i) => ({ ...x, i })).sort((a, b) => b.score - a.score).slice(0, 3).sort((a, b) => a.i - b.i).map((x) => ensurePeriod(x.s));
      cands.push({
        question: `What are the key ideas of \u201C${topic}\u201D?`,
        answer: top.join(" "),
        type: "summary",
        score: 0.6 + kw.sentenceScore(topic),
        section: topic,
        key: "sum:" + topic,
        order: order++
      });
    }
  }
  return selectBest(cands, opts.maxQuestions);
}
function selectBest(cands, max) {
  const seenQ = /* @__PURE__ */ new Set();
  const keyUses = /* @__PURE__ */ new Map();
  const typeCount = /* @__PURE__ */ new Map();
  const clozeCap = Math.max(2, Math.ceil(max * 0.4));
  const ranked = cands.map((c) => ({ ...c, rank: c.score * TYPE_WEIGHT[c.type] })).sort((a, b) => b.rank - a.rank);
  const picked = [];
  const deferred = [];
  for (const c of ranked) {
    if (picked.length >= max) break;
    const nq = c.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenQ.has(nq)) continue;
    const isCloze = c.type === "cloze" || c.type === "fact";
    const uses = keyUses.get(c.key) || 0;
    if (uses >= 1 || isCloze && (typeCount.get("cloze") || 0) >= clozeCap) {
      deferred.push(c);
      continue;
    }
    seenQ.add(nq);
    keyUses.set(c.key, uses + 1);
    if (isCloze) typeCount.set("cloze", (typeCount.get("cloze") || 0) + 1);
    picked.push(c);
  }
  for (const c of deferred) {
    if (picked.length >= max) break;
    const nq = c.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seenQ.has(nq) || (keyUses.get(c.key) || 0) >= 2) continue;
    seenQ.add(nq);
    keyUses.set(c.key, (keyUses.get(c.key) || 0) + 1);
    picked.push(c);
  }
  return picked.sort((a, b) => a.order - b.order).map(({ question, answer, type, score, section }) => ({ question, answer, type, score, section }));
}

// src/llm.ts
var SYSTEM_PROMPT = `You are an expert teacher who writes study questions from notes.
Rules:
- Use ONLY information stated in the note. Never invent facts.
- Mix question types: definitions, explanations ("why"/"how"), comparisons, facts, and application.
- Each answer must be correct, self-contained and concise (1\u20133 sentences, or a short list).
- Write questions and answers in the same language as the note.
- Do not reference "the text" or "the note" in questions; ask directly about the subject.
- Respond with JSON only, no commentary, in exactly this shape:
{"qa":[{"question":"...","answer":"..."}]}`;
function buildUserPrompt(title, chunk, n, extra, part) {
  return `Note title: ${title}${part ? ` (${part})` : ""}

--- NOTE START ---
${chunk}
--- NOTE END ---

Write ${n} high-quality question and answer pairs covering the most important ideas above.` + (extra.trim() ? `
Additional instructions: ${extra.trim()}` : "") + `
Return JSON only.`;
}
function chunkText(text, maxChars) {
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (p.length > maxChars) {
      if (cur) chunks.push(cur);
      cur = "";
      for (let i = 0; i < p.length; i += maxChars) chunks.push(p.slice(i, i + maxChars));
      continue;
    }
    if (cur.length + p.length + 2 > maxChars && cur) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur.trim()) chunks.push(cur);
  return chunks.filter((c) => c.trim().length > 0);
}
function parseQaResponse(raw) {
  const text = raw.replace(/```(?:json)?/gi, "").trim();
  const candidates = [text];
  const obj = text.indexOf("{");
  const arr = text.indexOf("[");
  if (obj >= 0) candidates.push(text.slice(obj, text.lastIndexOf("}") + 1));
  if (arr >= 0) candidates.push(text.slice(arr, text.lastIndexOf("]") + 1));
  for (const c of candidates) {
    try {
      const pairs2 = extractPairs(JSON.parse(c));
      if (pairs2.length) return pairs2;
    } catch (e) {
    }
  }
  const pairs = [];
  const re = /(?:^|\n)\s*(?:\d+[.)]\s*)?(?:\*\*)?(?:Q(?:uestion)?\s*\d*)(?:\*\*)?\s*[:.)-]\s*(?:\*\*)?([\s\S]+?)\n\s*(?:\*\*)?A(?:nswer)?\s*\d*(?:\*\*)?\s*[:.)-]\s*(?:\*\*)?([\s\S]+?)(?=\n\s*(?:\d+[.)]\s*)?(?:\*\*)?Q(?:uestion)?\s*\d*(?:\*\*)?\s*[:.)-]|$)/gi;
  let m;
  while (m = re.exec(text)) {
    const q = m[1].replace(/\*\*/g, "").trim();
    const a = m[2].replace(/\*\*/g, "").trim();
    if (q && a) pairs.push({ question: q, answer: a });
  }
  return pairs;
}
function extractPairs(data) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  let list = data;
  if (list && typeof list === "object" && !Array.isArray(list)) {
    const o = list;
    list = (_f = (_e = (_d = (_c = (_b = (_a = o.qa) != null ? _a : o.questions) != null ? _b : o.pairs) != null ? _c : o.items) != null ? _d : o.flashcards) != null ? _e : o.data) != null ? _f : Object.values(o).find((v) => Array.isArray(v));
  }
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const r = item;
    const q = (_j = (_i = (_h = (_g = r.question) != null ? _g : r.q) != null ? _h : r.Question) != null ? _i : r.prompt) != null ? _j : r.front;
    const a = (_n = (_m = (_l = (_k = r.answer) != null ? _k : r.a) != null ? _l : r.Answer) != null ? _m : r.response) != null ? _n : r.back;
    const qs = typeof q === "string" ? q.trim() : "";
    const as = Array.isArray(a) ? a.map(String).join("\n") : typeof a === "string" ? a.trim() : a != null ? String(a) : "";
    if (qs && as) out.push({ question: qs, answer: as });
  }
  return out;
}
function withTimeout(p, seconds, what) {
  if (!seconds || seconds <= 0) return p;
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${what} timed out after ${seconds}s. Try a smaller model or increase the timeout.`)),
      seconds * 1e3
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
var trimSlash = (u) => u.replace(/\/+$/, "");
async function chat(http, o, system, user) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const base = trimSlash(o.baseUrl);
  if (o.provider === "ollama") {
    const res2 = await withTimeout(
      http({
        url: `${base}/api/chat`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: o.model,
          stream: false,
          format: "json",
          options: { temperature: o.temperature, num_ctx: o.contextTokens },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ]
        })
      }),
      o.timeoutSeconds,
      "Ollama request"
    );
    if (res2.status >= 400) throw new Error(`Ollama error ${res2.status}: ${res2.text.slice(0, 300)}`);
    const j2 = JSON.parse(res2.text);
    return (_c = (_b = (_a = j2 == null ? void 0 : j2.message) == null ? void 0 : _a.content) != null ? _b : j2 == null ? void 0 : j2.response) != null ? _c : "";
  }
  const headers = { "Content-Type": "application/json" };
  if (o.apiKey) headers.Authorization = `Bearer ${o.apiKey}`;
  const res = await withTimeout(
    http({
      url: `${base}/chat/completions`,
      method: "POST",
      headers,
      body: JSON.stringify({
        model: o.model,
        temperature: o.temperature,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    }),
    o.timeoutSeconds,
    "Local AI request"
  );
  if (res.status >= 400) throw new Error(`Server error ${res.status}: ${res.text.slice(0, 300)}`);
  const j = JSON.parse(res.text);
  return (_j = (_i = (_f = (_e = (_d = j == null ? void 0 : j.choices) == null ? void 0 : _d[0]) == null ? void 0 : _e.message) == null ? void 0 : _f.content) != null ? _i : (_h = (_g = j == null ? void 0 : j.choices) == null ? void 0 : _g[0]) == null ? void 0 : _h.text) != null ? _j : "";
}
async function generateWithLlm(http, plainText, title, o, onProgress) {
  const chunks = chunkText(plainText, Math.max(1e3, o.maxChunkChars));
  if (!chunks.length) return [];
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < chunks.length; i++) {
    const share = Math.max(1, Math.round(o.maxQuestions * chunks[i].length / total));
    const part = chunks.length > 1 ? `part ${i + 1} of ${chunks.length}` : void 0;
    onProgress == null ? void 0 : onProgress(`Asking local model (${o.model})${part ? ` \u2014 ${part}` : ""}\u2026`);
    const raw = await chat(http, o, SYSTEM_PROMPT, buildUserPrompt(title, chunks[i], share, o.customInstructions, part));
    for (const p of parseQaResponse(raw)) {
      const k = p.question.toLowerCase().replace(/\W+/g, " ").trim();
      if (seen.has(k)) continue;
      seen.add(k);
      results.push({ question: p.question, answer: p.answer, type: "ai", score: 1 });
    }
  }
  return results.slice(0, o.maxQuestions);
}
async function listModels(http, provider, baseUrl, apiKey) {
  const base = trimSlash(baseUrl);
  if (provider === "ollama") {
    const res2 = await http({ url: `${base}/api/tags`, method: "GET" });
    if (res2.status >= 400) throw new Error(`HTTP ${res2.status}`);
    return (JSON.parse(res2.text).models || []).map((m) => m.name);
  }
  const res = await http({
    url: `${base}/models`,
    method: "GET",
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : void 0
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  return (JSON.parse(res.text).data || []).map((m) => m.id);
}

// src/format.ts
var quote = (s) => s.split("\n").map((l) => `> ${l}`).join("\n");
var escapeTableCell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
function renderQaNote(pairs, ctx) {
  const tagList = ctx.tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean);
  if (ctx.format === "spaced-repetition" && !tagList.includes("flashcards")) tagList.push("flashcards");
  const fm = [
    "---",
    `source: "${ctx.sourceLink.replace(/"/g, '\\"')}"`,
    `generated: ${ctx.timestamp}`,
    `engine: ${ctx.engineLabel}`,
    `questions: ${pairs.length}`,
    tagList.length ? `tags:
${tagList.map((t) => `  - ${t}`).join("\n")}` : "tags: []",
    "---",
    ""
  ].join("\n");
  const header = `# Q&A: ${ctx.sourceName}

Generated from ${ctx.sourceLink} \xB7 ${pairs.length} question${pairs.length === 1 ? "" : "s"} \xB7 ${ctx.engineLabel}
` + (ctx.format === "spaced-repetition" ? `
#flashcards
` : "") + "\n";
  if (ctx.format === "table") {
    const rows = pairs.map((p, i) => `| ${i + 1} | ${escapeTableCell(p.question)} | ${escapeTableCell(p.answer)} |`);
    return fm + header + `| # | Question | Answer |
|---|---|---|
${rows.join("\n")}
`;
  }
  const blocks = [];
  let lastSection = "\0";
  pairs.forEach((p, i) => {
    if (ctx.groupBySection && p.section !== lastSection) {
      if (p.section) blocks.push(`## ${p.section}
`);
      lastSection = p.section;
    }
    const n = i + 1;
    switch (ctx.format) {
      case "heading":
        blocks.push(`### ${n}. ${p.question}

**Answer:** ${p.answer.includes("\n") ? "\n" + p.answer : p.answer}
`);
        break;
      case "spaced-repetition":
        blocks.push(`${p.question}
?
${p.answer}
`);
        break;
      case "callout":
      default:
        blocks.push(`> [!question]- ${n}. ${p.question.replace(/\n/g, " ")}
${quote(p.answer)}
`);
        break;
    }
  });
  return fm + header + blocks.join("\n");
}

// src/flashcards.ts
var stripNumber = (q) => q.replace(/^\s*\d+[.)]\s+/, "").trim();
function parseQaNote(markdown) {
  const md = markdown.replace(/\r\n?/g, "\n").replace(/^---\n[\s\S]*?\n---\n?/, "");
  const lines = md.split("\n");
  const callout = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^>\s*\[!(?:question|faq|help|q)\][+-]?\s*(.*)$/i.exec(lines[i]);
    if (!m) continue;
    const ans = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) {
      ans.push(lines[++i].replace(/^>\s?/, ""));
    }
    const q = stripNumber(m[1]);
    const a = ans.join("\n").trim();
    if (q && a) callout.push({ question: q, answer: a });
  }
  if (callout.length) return callout;
  const heading = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^#{3,6}\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    const body = [];
    while (i + 1 < lines.length && !/^#{1,6}\s/.test(lines[i + 1])) body.push(lines[++i]);
    const a = body.join("\n").replace(/^\s*\*\*Answer:\*\*\s*/m, "").trim();
    const q = stripNumber(m[1]);
    if (q && a) heading.push({ question: q, answer: a });
  }
  if (heading.length) return heading;
  const table = [];
  for (const l of lines) {
    const m = /^\|\s*\d+\s*\|(.+)\|(.+)\|\s*$/.exec(l);
    if (!m) continue;
    const cell = (s) => s.trim().replace(/<br\s*\/?>/gi, "\n").replace(/\\\|/g, "|");
    table.push({ question: cell(m[1]), answer: cell(m[2]) });
  }
  if (table.length) return table;
  const sr = [];
  const blocks = md.split(/\n\s*\n/);
  for (const b of blocks) {
    const parts = b.split(/\n\?\n/);
    if (parts.length === 2) {
      const q = parts[0].trim();
      const a = parts[1].trim();
      if (q && a && !q.startsWith("#")) sr.push({ question: q, answer: a });
      continue;
    }
    for (const l of b.split("\n")) {
      const m = /^(.+?)\s*:::?\s*(.+)$/.exec(l);
      if (m && !l.startsWith("#")) sr.push({ question: m[1].trim(), answer: m[2].trim() });
    }
  }
  return sr;
}
function renderSpacedRepetitionNote(cards, ctx) {
  const deck = ctx.deckTag.replace(/^#/, "").trim() || "flashcards";
  const out = [
    "---",
    `source: "${ctx.sourceLink.replace(/"/g, '\\"')}"`,
    `generated: ${ctx.timestamp}`,
    `cards: ${cards.length}`,
    "---",
    "",
    `# Flashcards: ${ctx.sourceName}`,
    "",
    `#${deck}`,
    ""
  ];
  for (const c of cards) {
    const q = c.question.replace(/\n+/g, " ").trim();
    const a = c.answer.trim();
    if (!a.includes("\n") && !q.includes("::") && !a.includes("::")) out.push(`${q}::${a}`, "");
    else out.push(q, "?", a, "");
  }
  return out.join("\n");
}
var ankiField = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\t/g, " ").replace(/\n/g, "<br>");
function renderAnkiFile(cards, tags) {
  const tagField = tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").replace(/\//g, "::").trim()).filter(Boolean).join(" ");
  const header = ["#separator:tab", "#html:true", "#notetype:Basic", "#columns:Front	Back	Tags", "#tags column:3"];
  const rows = cards.map((c) => `${ankiField(c.question)}	${ankiField(c.answer)}	${tagField}`);
  return header.join("\n") + "\n" + rows.join("\n") + "\n";
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// src/study.ts
var import_obsidian = require("obsidian");
var StudyModal = class extends import_obsidian.Modal {
  constructor(app, cards, title, sourcePath, shuffleCards) {
    super(app);
    this.cards = cards;
    this.title = title;
    this.sourcePath = sourcePath;
    this.queue = [];
    this.flipped = false;
    this.reviewed = 0;
    this.firstTryCorrect = 0;
    this.missed = /* @__PURE__ */ new Set();
    this.renderComp = new import_obsidian.Component();
    this.keyHandler = (e) => this.onKey(e);
    this.shuffled = shuffleCards;
  }
  onOpen() {
    this.modalEl.addClass("qa-study-modal");
    this.renderComp.load();
    this.start(this.cards);
    document.addEventListener("keydown", this.keyHandler, true);
  }
  onClose() {
    document.removeEventListener("keydown", this.keyHandler, true);
    this.renderComp.unload();
    this.contentEl.empty();
  }
  start(cards) {
    this.queue = this.shuffled ? shuffle(cards) : cards.slice();
    this.reviewed = 0;
    this.firstTryCorrect = 0;
    this.missed = /* @__PURE__ */ new Set();
    this.flipped = false;
    this.render();
  }
  onKey(e) {
    if (!this.queue.length) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!this.flipped) this.flip();
      else this.answer(true);
    } else if (this.flipped && (e.key === "1" || e.key === "ArrowLeft")) {
      e.preventDefault();
      this.answer(false);
    } else if (this.flipped && (e.key === "2" || e.key === "ArrowRight")) {
      e.preventDefault();
      this.answer(true);
    }
  }
  flip() {
    this.flipped = true;
    this.render();
  }
  answer(gotIt) {
    const card = this.queue.shift();
    if (!card) return;
    if (gotIt) {
      this.reviewed++;
      if (!this.missed.has(card)) this.firstTryCorrect++;
    } else {
      this.missed.add(card);
      this.queue.push(card);
    }
    this.flipped = false;
    this.render();
  }
  renderMd(md, el) {
    import_obsidian.MarkdownRenderer.render(this.app, md, el, this.sourcePath, this.renderComp);
  }
  render() {
    const el = this.contentEl;
    el.empty();
    const total = this.cards.length;
    const header = el.createDiv({ cls: "qa-study-header" });
    header.createDiv({ text: `Flashcards: ${this.title}`, cls: "qa-study-title" });
    const shuffleLabel = header.createEl("label", { cls: "qa-study-shuffle" });
    const shuffleBox = shuffleLabel.createEl("input", { type: "checkbox" });
    shuffleBox.checked = this.shuffled;
    shuffleLabel.appendText(" Shuffle");
    shuffleBox.onchange = () => {
      this.shuffled = shuffleBox.checked;
      this.start(this.cards);
    };
    const done = total - this.queue.length;
    const bar = el.createDiv({ cls: "qa-study-progress" });
    bar.createDiv({ cls: "qa-study-progress-fill" }).style.width = `${done / total * 100}%`;
    el.createDiv({ text: `${done} / ${total} learned`, cls: "qa-study-count" });
    if (!this.queue.length) {
      const end = el.createDiv({ cls: "qa-study-card qa-study-done" });
      end.createDiv({ text: "\u{1F389} Session complete", cls: "qa-study-done-title" });
      const pct = Math.round(this.firstTryCorrect / total * 100);
      end.createDiv({ text: `${this.firstTryCorrect} of ${total} right on the first try (${pct}%).` });
      const actions2 = el.createDiv({ cls: "qa-study-actions" });
      if (this.missed.size) {
        const again = actions2.createEl("button", { text: `Review ${this.missed.size} missed`, cls: "mod-cta" });
        again.onclick = () => {
          const missed = this.cards.filter((c) => this.missed.has(c));
          this.start(missed);
        };
      }
      actions2.createEl("button", { text: "Restart all" }).onclick = () => this.start(this.cards);
      actions2.createEl("button", { text: "Close" }).onclick = () => this.close();
      return;
    }
    const card = this.queue[0];
    const cardEl = el.createDiv({ cls: "qa-study-card" + (this.flipped ? " is-flipped" : "") });
    cardEl.createDiv({ text: "Question", cls: "qa-study-side" });
    this.renderMd(card.question, cardEl.createDiv({ cls: "qa-study-question" }));
    if (this.flipped) {
      cardEl.createEl("hr");
      cardEl.createDiv({ text: "Answer", cls: "qa-study-side" });
      this.renderMd(card.answer, cardEl.createDiv({ cls: "qa-study-answer" }));
    } else {
      cardEl.createDiv({ text: "Click or press Space to show the answer", cls: "qa-study-hint" });
      cardEl.onclick = () => this.flip();
    }
    const actions = el.createDiv({ cls: "qa-study-actions" });
    if (!this.flipped) {
      actions.createEl("button", { text: "Show answer", cls: "mod-cta" }).onclick = () => this.flip();
    } else {
      const again = actions.createEl("button", { text: "Again (1)", cls: "mod-warning" });
      again.onclick = () => this.answer(false);
      const good = actions.createEl("button", { text: "Got it (2)", cls: "mod-cta" });
      good.onclick = () => this.answer(true);
    }
  }
};

// src/settings.ts
var import_obsidian2 = require("obsidian");
var PROVIDER_DEFAULT_URL = {
  ollama: "http://localhost:11434",
  openai: "http://localhost:1234/v1"
};
var DEFAULT_SETTINGS = {
  engine: "nlp",
  fallbackToNlp: true,
  maxQuestions: 15,
  includeCloze: true,
  includeSummaries: true,
  provider: "ollama",
  baseUrl: PROVIDER_DEFAULT_URL.ollama,
  model: "qwen2.5:3b",
  apiKey: "",
  temperature: 0.3,
  contextTokens: 8192,
  maxChunkChars: 6e3,
  timeoutSeconds: 600,
  customInstructions: "",
  outputFolder: "",
  ifExists: "overwrite",
  format: "callout",
  groupBySection: false,
  tags: "qa",
  openAfter: true,
  openInNewTab: true,
  autoFlashcards: false,
  flashcardSrNote: true,
  flashcardAnki: false,
  flashcardFolder: "",
  flashcardDeckTag: "flashcards",
  studyShuffle: true
};
var obsidianHttp = async (req) => {
  var _a;
  const res = await (0, import_obsidian2.requestUrl)({
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    contentType: (_a = req.headers) == null ? void 0 : _a["Content-Type"],
    throw: false
  });
  return { status: res.status, text: res.text };
};
var QASettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    const save = () => this.plugin.saveSettings();
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("Generation engine").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Engine").setDesc(
      "Built-in NLP: instant, fully offline, no setup (best for English). Local AI: higher-quality questions in any language from a small model running on your CPU via Ollama, LM Studio, llama.cpp or GPT4All."
    ).addDropdown(
      (d) => d.addOption("nlp", "Built-in NLP (offline, no setup)").addOption("llm", "Local AI model (CPU)").setValue(s.engine).onChange(async (v) => {
        s.engine = v;
        await save();
        this.display();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Number of questions").setDesc("Maximum number of Q&A pairs to generate.").addSlider(
      (sl) => sl.setLimits(3, 50, 1).setValue(s.maxQuestions).setDynamicTooltip().onChange(async (v) => {
        s.maxQuestions = v;
        await save();
      })
    );
    if (s.engine === "nlp") {
      new import_obsidian2.Setting(containerEl).setName("Fill-in-the-blank questions").setDesc("Create cloze questions from the most important sentences.").addToggle((t) => t.setValue(s.includeCloze).onChange(async (v) => {
        s.includeCloze = v;
        await save();
      }));
      new import_obsidian2.Setting(containerEl).setName("Section summary questions").setDesc("Ask for the key ideas of each heading.").addToggle((t) => t.setValue(s.includeSummaries).onChange(async (v) => {
        s.includeSummaries = v;
        await save();
      }));
    }
    if (s.engine === "llm") {
      new import_obsidian2.Setting(containerEl).setName("Local AI model").setHeading();
      const info = containerEl.createDiv({ cls: "setting-item-description qa-gen-info" });
      info.createEl("p", {
        text: "Install Ollama (ollama.com, Windows/macOS/Linux), then run e.g. `ollama pull qwen2.5:3b`. CPU-friendly models: qwen2.5:1.5b (fastest), llama3.2:3b, qwen2.5:3b, phi3.5 (best quality on 8 GB+ RAM)."
      });
      new import_obsidian2.Setting(containerEl).setName("Provider").setDesc("Ollama, or any OpenAI-compatible local server (LM Studio, llama.cpp, GPT4All, Jan, LocalAI).").addDropdown(
        (d) => d.addOption("ollama", "Ollama").addOption("openai", "OpenAI-compatible (LM Studio, llama.cpp\u2026)").setValue(s.provider).onChange(async (v) => {
          const prev = s.provider;
          s.provider = v;
          if (!s.baseUrl || s.baseUrl === PROVIDER_DEFAULT_URL[prev]) s.baseUrl = PROVIDER_DEFAULT_URL[s.provider];
          await save();
          this.display();
        })
      );
      new import_obsidian2.Setting(containerEl).setName("Server URL").setDesc(
        s.provider === "ollama" ? "Default: http://localhost:11434" : "Include /v1. LM Studio: http://localhost:1234/v1 \xB7 llama.cpp: http://localhost:8080/v1 \xB7 GPT4All: http://localhost:4891/v1"
      ).addText(
        (t) => t.setPlaceholder(PROVIDER_DEFAULT_URL[s.provider]).setValue(s.baseUrl).onChange(async (v) => {
          s.baseUrl = v.trim();
          await save();
        })
      );
      const modelSetting = new import_obsidian2.Setting(containerEl).setName("Model").setDesc("Model name exactly as your server lists it.").addText(
        (t) => t.setPlaceholder("qwen2.5:3b").setValue(s.model).onChange(async (v) => {
          s.model = v.trim();
          await save();
        })
      );
      modelSetting.addButton(
        (b) => b.setButtonText("Test connection").onClick(async () => {
          try {
            const models = await listModels(obsidianHttp, s.provider, s.baseUrl, s.apiKey);
            if (!models.length) {
              new import_obsidian2.Notice("Connected, but no models found. Pull or load a model first.");
              return;
            }
            const has = models.includes(s.model) || models.some((m) => m.split(":")[0] === s.model);
            new import_obsidian2.Notice(
              `Connected \u2713 ${models.length} model(s): ${models.slice(0, 8).join(", ")}` + (has ? "" : `
\u26A0 "${s.model}" not found on server.`),
              1e4
            );
          } catch (e) {
            new import_obsidian2.Notice(`Could not reach ${s.baseUrl}: ${e.message}. Is the server running?`, 1e4);
          }
        })
      );
      if (s.provider === "openai") {
        new import_obsidian2.Setting(containerEl).setName("API key (optional)").setDesc("Only if your local server requires one.").addText((t) => {
          t.inputEl.type = "password";
          t.setValue(s.apiKey).onChange(async (v) => {
            s.apiKey = v.trim();
            await save();
          });
        });
      }
      new import_obsidian2.Setting(containerEl).setName("Temperature").setDesc("Lower = more factual, higher = more varied.").addSlider(
        (sl) => sl.setLimits(0, 1, 0.05).setValue(s.temperature).setDynamicTooltip().onChange(async (v) => {
          s.temperature = v;
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName("Chunk size (characters)").setDesc("Long notes are split into chunks of this size. Smaller = faster on slow CPUs.").addText(
        (t) => t.setValue(String(s.maxChunkChars)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (n >= 1e3) {
            s.maxChunkChars = n;
            await save();
          }
        })
      );
      if (s.provider === "ollama") {
        new import_obsidian2.Setting(containerEl).setName("Context window (tokens)").setDesc("Ollama num_ctx. 8192 fits ~6000-character chunks. Larger uses more RAM.").addText(
          (t) => t.setValue(String(s.contextTokens)).onChange(async (v) => {
            const n = parseInt(v, 10);
            if (n >= 1024) {
              s.contextTokens = n;
              await save();
            }
          })
        );
      }
      new import_obsidian2.Setting(containerEl).setName("Timeout (seconds)").setDesc("CPU generation can take a few minutes for long notes.").addText(
        (t) => t.setValue(String(s.timeoutSeconds)).onChange(async (v) => {
          const n = parseInt(v, 10);
          if (n >= 10) {
            s.timeoutSeconds = n;
            await save();
          }
        })
      );
      new import_obsidian2.Setting(containerEl).setName("Extra instructions").setDesc("Optional, e.g. \u201CFocus on exam-style questions\u201D or \u201CAnswer in one sentence\u201D.").addTextArea(
        (t) => t.setValue(s.customInstructions).onChange(async (v) => {
          s.customInstructions = v;
          await save();
        })
      );
      new import_obsidian2.Setting(containerEl).setName("Fall back to built-in NLP").setDesc("If the local model is unreachable or fails, use the offline engine instead.").addToggle((t) => t.setValue(s.fallbackToNlp).onChange(async (v) => {
        s.fallbackToNlp = v;
        await save();
      }));
    }
    new import_obsidian2.Setting(containerEl).setName("Output note").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Format").addDropdown(
      (d) => d.addOption("callout", "Collapsible callouts (answer hidden)").addOption("heading", "Headings with answers").addOption("spaced-repetition", "Spaced Repetition flashcards").addOption("table", "Table").setValue(s.format).onChange(async (v) => {
        s.format = v;
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Output folder").setDesc("Leave empty to create QA_<note> next to the original note.").addText(
      (t) => t.setPlaceholder("e.g. Q&A").setValue(s.outputFolder).onChange(async (v) => {
        s.outputFolder = v.trim();
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("If QA note already exists").addDropdown(
      (d) => d.addOption("overwrite", "Overwrite it").addOption("new", "Create a new numbered note").setValue(s.ifExists).onChange(async (v) => {
        s.ifExists = v;
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Group by section").setDesc("Insert the source note's headings above their questions.").addToggle((t) => t.setValue(s.groupBySection).onChange(async (v) => {
      s.groupBySection = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Tags").setDesc("Comma-separated tags added to the QA note's properties.").addText((t) => t.setValue(s.tags).onChange(async (v) => {
      s.tags = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Open the new note").addToggle((t) => t.setValue(s.openAfter).onChange(async (v) => {
      s.openAfter = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Open in a new tab").addToggle((t) => t.setValue(s.openInNewTab).onChange(async (v) => {
      s.openInNewTab = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Flashcards").setHeading();
    new import_obsidian2.Setting(containerEl).setName("Create flashcards automatically").setDesc("Also create flashcards every time a Q&A note is generated. You can always create them later from the panel, the command palette, or by right-clicking a QA_ note.").addToggle((t) => t.setValue(s.autoFlashcards).onChange(async (v) => {
      s.autoFlashcards = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Spaced Repetition deck note").setDesc("Create Flashcards_<note>.md, ready for the \u201CSpaced Repetition\u201D community plugin (Q::A and ? syntax).").addToggle((t) => t.setValue(s.flashcardSrNote).onChange(async (v) => {
      s.flashcardSrNote = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Anki import file").setDesc("Create Flashcards_<note>.txt for Anki \u2192 File \u2192 Import (tab-separated, Basic note type, tags included).").addToggle((t) => t.setValue(s.flashcardAnki).onChange(async (v) => {
      s.flashcardAnki = v;
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Deck tag").setDesc("Tag used as the deck name, e.g. flashcards or flashcards/biology.").addText((t) => t.setValue(s.flashcardDeckTag).onChange(async (v) => {
      s.flashcardDeckTag = v.trim();
      await save();
    }));
    new import_obsidian2.Setting(containerEl).setName("Flashcards folder").setDesc("Leave empty to save flashcards next to the QA note.").addText(
      (t) => t.setPlaceholder("e.g. Flashcards").setValue(s.flashcardFolder).onChange(async (v) => {
        s.flashcardFolder = v.trim();
        await save();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Shuffle cards when studying").addToggle((t) => t.setValue(s.studyShuffle).onChange(async (v) => {
      s.studyShuffle = v;
      await save();
    }));
  }
};

// src/view.ts
var import_obsidian3 = require("obsidian");
var VIEW_TYPE_QA = "qa-generator-sidebar";
var QA_ICON = "qa-generator";
var QA_ICON_SVG = `<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
<path d="M58 8H24a8 8 0 0 0-8 8v68a8 8 0 0 0 8 8h52a8 8 0 0 0 8-8V34z"/><path d="M58 8v26h26"/>
<path d="M40 50a10 10 0 1 1 14 9c-3 1.5-4 3.5-4 6.5"/><path d="M50 78h.01"/></g>`;
var QASidebarView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_QA;
  }
  getDisplayText() {
    return "Q&A Generator";
  }
  getIcon() {
    return QA_ICON;
  }
  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("qa-gen-panel");
    root.createEl("h4", { text: "Q&A Generator", cls: "qa-gen-title" });
    const noteBox = root.createDiv({ cls: "qa-gen-card" });
    noteBox.createDiv({ text: "Current note", cls: "qa-gen-label" });
    this.noteEl = noteBox.createDiv({ cls: "qa-gen-note" });
    const s = this.plugin.settings;
    const engineRow = root.createDiv({ cls: "qa-gen-row" });
    engineRow.createEl("label", { text: "Engine", cls: "qa-gen-label" });
    const engineSel = engineRow.createEl("select", { cls: "dropdown" });
    engineSel.createEl("option", { value: "nlp", text: "Built-in NLP (offline)" });
    engineSel.createEl("option", { value: "llm", text: `Local AI (${s.model || "model"})` });
    engineSel.value = s.engine;
    engineSel.onchange = async () => {
      s.engine = engineSel.value;
      await this.plugin.saveSettings();
    };
    const countRow = root.createDiv({ cls: "qa-gen-row" });
    const countLabel = countRow.createEl("label", { text: `Questions: ${s.maxQuestions}`, cls: "qa-gen-label" });
    const slider = countRow.createEl("input", { type: "range", cls: "slider" });
    slider.min = "3";
    slider.max = "50";
    slider.value = String(s.maxQuestions);
    slider.oninput = () => countLabel.textContent = `Questions: ${slider.value}`;
    slider.onchange = async () => {
      s.maxQuestions = parseInt(slider.value, 10);
      await this.plugin.saveSettings();
    };
    const autoRow = root.createEl("label", { cls: "qa-gen-check" });
    const autoBox = autoRow.createEl("input", { type: "checkbox" });
    autoBox.checked = s.autoFlashcards;
    autoRow.appendText(" Also create flashcards");
    autoBox.onchange = async () => {
      s.autoFlashcards = autoBox.checked;
      await this.plugin.saveSettings();
    };
    this.buttonEl = root.createEl("button", { text: "Generate Q&A", cls: "mod-cta qa-gen-button" });
    this.buttonEl.onclick = () => this.run();
    this.statusEl = root.createDiv({ cls: "qa-gen-status" });
    this.resultEl = root.createDiv({ cls: "qa-gen-result" });
    const flash = root.createDiv({ cls: "qa-gen-card qa-gen-flash" });
    flash.createDiv({ text: "Flashcards", cls: "qa-gen-label" });
    const flashRow = flash.createDiv({ cls: "qa-gen-flash-row" });
    this.flashBtn = flashRow.createEl("button", { text: "Create flashcards" });
    this.flashBtn.onclick = () => {
      const qa = this.qaFile();
      if (qa) this.plugin.createFlashcards(qa);
    };
    this.studyBtn = flashRow.createEl("button", { text: "Study" });
    this.studyBtn.onclick = () => {
      const qa = this.qaFile();
      if (qa) this.plugin.studyFlashcards(qa);
    };
    this.flashHint = flash.createDiv({ cls: "qa-gen-status" });
    this.flashResultEl = flash.createDiv({ cls: "qa-gen-result" });
    const settingsLink = root.createEl("a", { text: "Plugin settings", cls: "qa-gen-settings-link", href: "#" });
    settingsLink.onclick = (e) => {
      e.preventDefault();
      const setting = this.app.setting;
      setting == null ? void 0 : setting.open();
      setting == null ? void 0 : setting.openTabById(this.plugin.manifest.id);
    };
    this.registerEvent(this.app.workspace.on("file-open", () => this.refresh()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.refresh()));
    this.registerEvent(this.app.vault.on("create", () => this.refresh()));
    this.refresh();
  }
  /** Last markdown note the user looked at (the sidebar itself steals focus when clicked). */
  targetFile() {
    return this.plugin.lastMarkdownFile;
  }
  qaFile() {
    const f = this.targetFile();
    return f ? this.plugin.resolveQaFile(f) : null;
  }
  refresh() {
    if (!this.noteEl) return;
    const qa = this.qaFile();
    this.flashBtn.disabled = !qa;
    this.studyBtn.disabled = !qa;
    this.flashHint.setText(qa ? `From ${qa.basename}` : "Generate a Q&A note first.");
    const f = this.targetFile();
    const busy = this.plugin.isRunning;
    this.noteEl.setText(f ? f.basename : "No note open");
    this.noteEl.toggleClass("qa-gen-muted", !f);
    const isQa = !!f && f.basename.startsWith("QA_");
    this.buttonEl.disabled = !f || busy || isQa;
    this.buttonEl.setText(busy ? "Generating\u2026" : "Generate Q&A");
    if (isQa) this.statusEl.setText("This is already a Q&A note.");
    else if (!busy && this.statusEl.getText() === "This is already a Q&A note.") this.statusEl.setText("");
  }
  setStatus(text) {
    var _a;
    (_a = this.statusEl) == null ? void 0 : _a.setText(text);
  }
  showResult(file, count) {
    if (!this.resultEl) return;
    this.resultEl.empty();
    this.resultEl.createSpan({ text: `\u2713 ${count} questions \u2192 ` });
    const link = this.resultEl.createEl("a", { text: file.basename, href: "#" });
    link.onclick = (e) => {
      e.preventDefault();
      this.app.workspace.getLeaf("tab").openFile(file);
    };
  }
  showFlashcards(files, count) {
    if (!this.flashResultEl) return;
    this.flashResultEl.empty();
    this.flashResultEl.createSpan({ text: `\u2713 ${count} cards \u2192 ` });
    files.forEach((file, i) => {
      if (i) this.flashResultEl.createSpan({ text: ", " });
      const link = this.flashResultEl.createEl("a", { text: file.name, href: "#" });
      link.onclick = (e) => {
        e.preventDefault();
        if (file.extension === "md") this.app.workspace.getLeaf("tab").openFile(file);
        else new import_obsidian3.Notice(`Import ${file.path} in Anki via File \u2192 Import.`, 8e3);
      };
    });
  }
  async run() {
    const f = this.targetFile();
    if (!f) {
      new import_obsidian3.Notice("Open a markdown note first.");
      return;
    }
    this.resultEl.empty();
    this.flashResultEl.empty();
    await this.plugin.generate(f);
  }
};

// src/main.ts
var QA_PREFIX = "QA_";
var FLASHCARD_PREFIX = "Flashcards_";
var QAGeneratorPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.running = false;
    /** Last markdown note the user had open (the sidebar panel targets this). */
    this.lastMarkdownFile = null;
  }
  get isRunning() {
    return this.running;
  }
  async onload() {
    await this.loadSettings();
    (0, import_obsidian4.addIcon)(QA_ICON, QA_ICON_SVG);
    this.registerView(VIEW_TYPE_QA, (leaf) => new QASidebarView(leaf, this));
    this.addRibbonIcon(QA_ICON, "Open Q&A Generator panel", () => this.activateView());
    this.addCommand({
      id: "open-qa-panel",
      name: "Open Q&A Generator panel",
      callback: () => this.activateView()
    });
    const track = () => {
      const f = this.app.workspace.getActiveFile();
      if (f && f.extension === "md") this.lastMarkdownFile = f;
      this.forEachView((v) => v.refresh());
    };
    this.registerEvent(this.app.workspace.on("file-open", track));
    this.registerEvent(this.app.workspace.on("active-leaf-change", track));
    this.registerEvent(
      this.app.vault.on("delete", (f) => {
        if (f === this.lastMarkdownFile) this.lastMarkdownFile = null;
        this.forEachView((v) => v.refresh());
      })
    );
    this.registerEvent(this.app.vault.on("create", () => this.forEachView((v) => v.refresh())));
    this.app.workspace.onLayoutReady(track);
    this.addCommand({
      id: "generate-qa-current-note",
      name: "Generate Q&A from current note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) this.generate(file);
        return true;
      }
    });
    this.addCommand({
      id: "generate-qa-current-note-nlp",
      name: "Generate Q&A from current note (built-in NLP)",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) this.generate(file, "nlp");
        return true;
      }
    });
    this.addCommand({
      id: "create-flashcards",
      name: "Create flashcards from Q&A note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const qa = file && this.resolveQaFile(file);
        if (!qa) return false;
        if (!checking) this.createFlashcards(qa);
        return true;
      }
    });
    this.addCommand({
      id: "study-flashcards",
      name: "Study flashcards",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const qa = file && this.resolveQaFile(file);
        if (!qa) return false;
        if (!checking) this.studyFlashcards(qa);
        return true;
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        const qa = file instanceof import_obsidian4.TFile && file.extension === "md" ? this.resolveQaFile(file) : null;
        if (qa) {
          menu.addItem(
            (item) => item.setTitle("Create flashcards").setIcon("layers").onClick(() => this.createFlashcards(qa))
          );
          menu.addItem(
            (item) => item.setTitle("Study flashcards").setIcon("graduation-cap").onClick(() => this.studyFlashcards(qa))
          );
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof import_obsidian4.TFile && file.extension === "md" && !file.basename.startsWith(QA_PREFIX)) {
          menu.addItem(
            (item) => item.setTitle("Generate Q&A note").setIcon(QA_ICON).onClick(() => this.generate(file))
          );
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, _editor, view) => {
        const file = view.file;
        if (file && !file.basename.startsWith(QA_PREFIX)) {
          menu.addItem(
            (item) => item.setTitle("Generate Q&A note").setIcon(QA_ICON).onClick(() => this.generate(file))
          );
        }
      })
    );
    this.addSettingTab(new QASettingTab(this.app, this));
  }
  onunload() {
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_QA)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      await right.setViewState({ type: VIEW_TYPE_QA, active: true });
      leaf = right;
    }
    workspace.revealLeaf(leaf);
  }
  forEachView(fn) {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_QA)) {
      if (leaf.view instanceof QASidebarView) fn(leaf.view);
    }
  }
  /** Update both the floating notice and the sidebar panel. */
  setStatus(status, msg) {
    status.setMessage(msg);
    this.forEachView((v) => v.setStatus(msg));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async generate(file, forceEngine) {
    if (this.running) {
      new import_obsidian4.Notice("Q&A generation is already running\u2026");
      return;
    }
    if (file.basename.startsWith(QA_PREFIX)) {
      new import_obsidian4.Notice("This is already a Q&A note. Open the original note and run the command there.");
      return;
    }
    this.running = true;
    this.forEachView((v) => v.refresh());
    const status = new import_obsidian4.Notice("Reading note\u2026", 0);
    this.setStatus(status, "Reading note\u2026");
    try {
      const editorView = this.app.workspace.getLeavesOfType("markdown").map((l) => l.view).find((v) => {
        var _a;
        return v instanceof import_obsidian4.MarkdownView && ((_a = v.file) == null ? void 0 : _a.path) === file.path;
      });
      const content = editorView ? editorView.editor.getValue() : await this.app.vault.read(file);
      if (!parseNote(content, file.basename).plainText.trim()) {
        new import_obsidian4.Notice("This note has no text to generate questions from.");
        return;
      }
      const s = this.settings;
      const engine = forceEngine != null ? forceEngine : s.engine;
      let pairs = [];
      let engineLabel = "Built-in NLP";
      if (engine === "llm") {
        try {
          this.setStatus(status, `Generating with local model ${s.model}\u2026 (CPU \u2014 this can take a minute)`);
          pairs = await generateWithLlm(
            obsidianHttp,
            cleanForLlm(content),
            file.basename,
            {
              provider: s.provider,
              baseUrl: s.baseUrl,
              model: s.model,
              apiKey: s.apiKey,
              temperature: s.temperature,
              contextTokens: s.contextTokens,
              maxChunkChars: s.maxChunkChars,
              timeoutSeconds: s.timeoutSeconds,
              maxQuestions: s.maxQuestions,
              customInstructions: s.customInstructions
            },
            (msg) => this.setStatus(status, msg)
          );
          engineLabel = `Local AI (${s.model})`;
          if (!pairs.length) throw new Error("the model returned no usable questions");
        } catch (e) {
          const msg = e.message || String(e);
          console.error("[QA Generator] Local AI failed:", e);
          if (!s.fallbackToNlp) throw new Error(`Local AI failed: ${msg}`);
          new import_obsidian4.Notice(`Local AI failed (${msg}). Using built-in NLP instead.`, 8e3);
          pairs = [];
        }
      }
      if (!pairs.length) {
        this.setStatus(status, "Generating questions with built-in NLP\u2026");
        pairs = generateWithNlp(content, file.basename, {
          maxQuestions: s.maxQuestions,
          includeCloze: s.includeCloze,
          includeSummaries: s.includeSummaries
        });
        engineLabel = "Built-in NLP";
      }
      if (!pairs.length) {
        new import_obsidian4.Notice("Couldn't generate any questions \u2014 the note may be too short.");
        return;
      }
      this.setStatus(status, "Writing Q&A note\u2026");
      const outFile = await this.writeQaNote(file, pairs, engineLabel);
      new import_obsidian4.Notice(`Created ${outFile.basename} with ${pairs.length} questions.`);
      this.forEachView((v) => {
        v.setStatus("");
        v.showResult(outFile, pairs.length);
      });
      if (s.autoFlashcards) {
        await this.createFlashcards(outFile, pairs.map((p) => ({ question: p.question, answer: p.answer })));
      }
      if (s.openAfter) {
        await this.app.workspace.getLeaf(s.openInNewTab ? "tab" : false).openFile(outFile);
      }
    } catch (e) {
      console.error("[QA Generator]", e);
      new import_obsidian4.Notice(`Q&A generation failed: ${e.message}`, 1e4);
      this.forEachView((v) => v.setStatus(`Failed: ${e.message}`));
    } finally {
      status.hide();
      this.running = false;
      this.forEachView((v) => v.refresh());
    }
  }
  // ------------------------------------------------------------------ Flashcards
  /** Folder + path where the QA note for `source` lives (or would live). */
  qaPathFor(source) {
    const parentPath = source.parent && source.parent.path !== "/" ? source.parent.path : "";
    const folder = this.settings.outputFolder ? (0, import_obsidian4.normalizePath)(this.settings.outputFolder) : parentPath;
    return (0, import_obsidian4.normalizePath)(folder ? `${folder}/${QA_PREFIX}${source.basename}.md` : `${QA_PREFIX}${source.basename}.md`);
  }
  /** The QA note itself, or the QA note generated from this source note, if any. */
  resolveQaFile(file) {
    if (file.extension !== "md" || file.basename.startsWith(FLASHCARD_PREFIX)) return null;
    if (file.basename.startsWith(QA_PREFIX)) return file;
    const qa = this.app.vault.getAbstractFileByPath(this.qaPathFor(file));
    return qa instanceof import_obsidian4.TFile ? qa : null;
  }
  async loadCards(qaFile) {
    const editorView = this.app.workspace.getLeavesOfType("markdown").map((l) => l.view).find((v) => {
      var _a;
      return v instanceof import_obsidian4.MarkdownView && ((_a = v.file) == null ? void 0 : _a.path) === qaFile.path;
    });
    const md = editorView ? editorView.editor.getValue() : await this.app.vault.read(qaFile);
    return parseQaNote(md);
  }
  async writeFile(path, content) {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, content);
      return existing;
    }
    return this.app.vault.create(path, content);
  }
  /**
   * Create flashcard files from a QA note. Cards are read from the QA note itself
   * (so your manual edits are respected) unless freshly generated cards are passed in.
   */
  async createFlashcards(qaFile, cards) {
    const s = this.settings;
    try {
      const list = cards != null ? cards : await this.loadCards(qaFile);
      if (!list.length) {
        new import_obsidian4.Notice(`No questions found in ${qaFile.basename}.`);
        return [];
      }
      if (!s.flashcardSrNote && !s.flashcardAnki) {
        new import_obsidian4.Notice("Enable \u201CSpaced Repetition deck note\u201D or \u201CAnki import file\u201D in the plugin settings.");
        return [];
      }
      const parentPath = qaFile.parent && qaFile.parent.path !== "/" ? qaFile.parent.path : "";
      const folder = s.flashcardFolder ? (0, import_obsidian4.normalizePath)(s.flashcardFolder) : parentPath;
      if (folder && !(this.app.vault.getAbstractFileByPath(folder) instanceof import_obsidian4.TFolder)) {
        await this.app.vault.createFolder(folder);
      }
      const sourceName = qaFile.basename.slice(QA_PREFIX.length) || qaFile.basename;
      const pathFor = (ext) => (0, import_obsidian4.normalizePath)(folder ? `${folder}/${FLASHCARD_PREFIX}${sourceName}.${ext}` : `${FLASHCARD_PREFIX}${sourceName}.${ext}`);
      const created = [];
      if (s.flashcardSrNote) {
        const path = pathFor("md");
        const source = this.app.metadataCache.getFirstLinkpathDest(sourceName, qaFile.path);
        const body = renderSpacedRepetitionNote(list, {
          sourceLink: this.app.fileManager.generateMarkdownLink(source != null ? source : qaFile, path),
          sourceName,
          timestamp: (0, import_obsidian4.moment)().format("YYYY-MM-DD HH:mm"),
          deckTag: s.flashcardDeckTag
        });
        created.push(await this.writeFile(path, body));
      }
      if (s.flashcardAnki) {
        created.push(await this.writeFile(pathFor("txt"), renderAnkiFile(list, `${s.flashcardDeckTag} ${sourceName.replace(/\s+/g, "_")}`)));
      }
      new import_obsidian4.Notice(`Created ${list.length} flashcards \u2192 ${created.map((f) => f.name).join(", ")}`);
      this.forEachView((v) => v.showFlashcards(created, list.length));
      return created;
    } catch (e) {
      console.error("[QA Generator] flashcards", e);
      new import_obsidian4.Notice(`Creating flashcards failed: ${e.message}`, 1e4);
      return [];
    }
  }
  async studyFlashcards(qaFile) {
    const cards = await this.loadCards(qaFile);
    if (!cards.length) {
      new import_obsidian4.Notice(`No questions found in ${qaFile.basename}.`);
      return;
    }
    const title = qaFile.basename.slice(QA_PREFIX.length) || qaFile.basename;
    new StudyModal(this.app, cards, title, qaFile.path, this.settings.studyShuffle).open();
  }
  async writeQaNote(source, pairs, engineLabel) {
    const s = this.settings;
    const parentPath = source.parent && source.parent.path !== "/" ? source.parent.path : "";
    const folder = s.outputFolder ? (0, import_obsidian4.normalizePath)(s.outputFolder) : parentPath;
    if (folder && !(this.app.vault.getAbstractFileByPath(folder) instanceof import_obsidian4.TFolder)) {
      await this.app.vault.createFolder(folder);
    }
    const base = `${QA_PREFIX}${source.basename}`;
    const pathFor = (name) => (0, import_obsidian4.normalizePath)(folder ? `${folder}/${name}.md` : `${name}.md`);
    let path = pathFor(base);
    let existing = this.app.vault.getAbstractFileByPath(path);
    if (existing && s.ifExists === "new") {
      let i = 2;
      while (this.app.vault.getAbstractFileByPath(pathFor(`${base} ${i}`))) i++;
      path = pathFor(`${base} ${i}`);
      existing = null;
    }
    const body = renderQaNote(pairs, {
      sourceLink: this.app.fileManager.generateMarkdownLink(source, path),
      sourceName: source.basename,
      engineLabel,
      timestamp: (0, import_obsidian4.moment)().format("YYYY-MM-DD HH:mm"),
      format: s.format,
      tags: s.tags,
      groupBySection: s.groupBySection
    });
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, body);
      return existing;
    }
    return this.app.vault.create(path, body);
  }
};
