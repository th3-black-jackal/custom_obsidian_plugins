"use strict";
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

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ZoteroMetadataPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// core.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  port: 23119,
  insertMode: "frontmatter",
  template: "**Title:** {{title}}\n**Authors:** {{authors}}\n**Date:** {{date}}\n**Publisher:** {{publisher}}\n**DOI:** {{doi}}\n",
  useParsedDate: true,
  authorFormat: "last-first",
  highlightsHeading: "## Highlights",
  highlightTemplate: "> [!quote] [{{pageRef}}]({{link}})\n> {{text}}\n\n{{comment}}\n",
  highlightsPlacement: "cursor"
};
var PUBLISHER_FIELDS = [
  "publisher",
  "university",
  // thesis
  "institution",
  // report
  "label",
  // audio recording
  "distributor",
  // film
  "company",
  // computer program (older schemas)
  "network",
  // tv / radio broadcast
  "studio"
];
function formatCreator(c, fmt) {
  if (c.name) return c.name.trim();
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  if (!first) return last;
  if (!last) return first;
  return fmt === "last-first" ? `${last}, ${first}` : `${first} ${last}`;
}
function extractDoi(data) {
  if (data.DOI) return String(data.DOI).trim();
  const m = String(data.extra ?? "").match(/^\s*DOI:\s*(10\.\S+)\s*$/im);
  return m ? m[1] : "";
}
function extractMeta(item, s) {
  const d = item.data;
  const creators = d.creators ?? [];
  let authors = creators.filter((c) => c.creatorType === "author");
  if (authors.length === 0) authors = creators;
  const publisher = PUBLISHER_FIELDS.map((f) => d[f]).find((v) => v && String(v).trim()) ?? "";
  return {
    title: (d.title ?? "").trim(),
    date: s.useParsedDate && item.meta?.parsedDate || (d.date ?? "").trim(),
    publisher: String(publisher).trim(),
    doi: extractDoi(d),
    authors: authors.map((c) => formatCreator(c, s.authorFormat)).filter(Boolean),
    key: item.key
  };
}
function renderTemplate(tpl, m) {
  const values = {
    title: m.title,
    date: m.date,
    publisher: m.publisher,
    doi: m.doi,
    doiUrl: m.doi ? `https://doi.org/${m.doi}` : "",
    authors: m.authors.join("; "),
    authorsList: m.authors.map((a) => `- ${a}`).join("\n"),
    key: m.key,
    zoteroLink: `zotero://select/library/items/${m.key}`
  };
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? "");
}
var ZoteroError = class extends Error {
  constructor(message, fix) {
    super(message);
    this.fix = fix;
  }
};
function describeError(e) {
  if (e instanceof ZoteroError) return { message: e.message, fix: e.fix };
  return { message: `Couldn't talk to Zotero: ${e?.message ?? e}`, fix: "Make sure Zotero is running." };
}
var ZoteroClient = class {
  constructor(getPort) {
    this.getPort = getPort;
  }
  base() {
    return `http://127.0.0.1:${this.getPort()}/api/users/0`;
  }
  async ping() {
    await this.get(`${this.base()}/items/top?limit=1&format=json`);
  }
  /** GET a local-API URL, turning failures into a ZoteroError with a fix the user can act on. */
  async get(url) {
    let res;
    try {
      res = await (0, import_obsidian.requestUrl)({
        url,
        throw: false,
        headers: {
          // Zotero 10+ silently drops requests whose User-Agent starts with "Mozilla/"
          // (which Obsidian's does) unless this header is present.
          "Zotero-Allowed-Request": "1",
          "Zotero-API-Version": "3"
        }
      });
    } catch (e) {
      throw new ZoteroError(
        "Couldn't connect to Zotero.",
        "Start Zotero and tick Settings \u2192 Advanced \u2192 'Allow other applications on this computer to communicate with Zotero'. If you changed Zotero's port, set the same port in this plugin's settings."
      );
    }
    if (res.status === 200) return res.json;
    const header = (name) => {
      const h = res.headers ?? {};
      const k = Object.keys(h).find((x) => x.toLowerCase() === name);
      return k ? h[k] : "";
    };
    const version = header("x-zotero-version");
    const body = (res.text ?? "").trim();
    if (res.status === 404 && /no endpoint found/i.test(body)) {
      const major = parseInt(version, 10);
      if (version && major < 7) {
        throw new ZoteroError(
          `Your Zotero${version ? ` (${version})` : ""} doesn't have the local API.`,
          "Update to Zotero 7 or later (Help \u2192 Check for Updates, or zotero.org/download)."
        );
      }
      throw new ZoteroError(
        `Zotero${version ? ` ${version}` : ""} didn't recognise the local API address.`,
        "In Zotero, open Settings \u2192 Advanced, make sure 'Allow other applications on this computer to communicate with Zotero' is ticked, then restart Zotero."
      );
    }
    if (res.status === 403) {
      throw new ZoteroError(
        "Zotero's local API is turned off.",
        "In Zotero, open Settings \u2192 Advanced and tick 'Allow other applications on this computer to communicate with Zotero'."
      );
    }
    throw new ZoteroError(
      `Zotero${version ? ` ${version}` : ""} replied with HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}.`,
      "Restart Zotero and try again."
    );
  }
  /**
   * Search items. With a collection key, only items in that collection are searched.
   * An empty query lists the collection's (or library's) items.
   */
  async search(query, collectionKey) {
    const params = new URLSearchParams({
      limit: collectionKey && !query ? "100" : "25",
      format: "json",
      sort: query ? "dateModified" : "title",
      direction: query ? "desc" : "asc"
    });
    if (query) {
      params.set("q", query);
      params.set("qmode", "titleCreatorYear");
    }
    const scope = collectionKey ? `/collections/${encodeURIComponent(collectionKey)}` : "";
    const json = await this.get(`${this.base()}${scope}/items/top?${params}`);
    return json.filter(
      (i) => i.data.itemType !== "attachment" && i.data.itemType !== "note" && i.data.itemType !== "annotation"
    );
  }
  /** Fetch one item fresh from Zotero (used to refresh the review card). */
  async getItem(key) {
    return await this.get(`${this.base()}/items/${encodeURIComponent(key)}?format=json`);
  }
  async children(key) {
    const all = [];
    const pageSize = 100;
    for (let start = 0; start < 2e4; start += pageSize) {
      const page = await this.get(
        `${this.base()}/items/${encodeURIComponent(key)}/children?format=json&limit=${pageSize}&start=${start}`
      );
      all.push(...page);
      if (page.length < pageSize) break;
    }
    return all;
  }
  /**
   * All annotations (highlights, underlines, notes, images…) made on the item's
   * attachments, in reading order. Works for PDF, EPUB and snapshot attachments.
   */
  async getAnnotations(itemKey) {
    const kids = await this.children(itemKey);
    const attachments = kids.filter((k) => k.data.itemType === "attachment");
    const out = [];
    for (const att of attachments) {
      const anns = (await this.children(att.key)).filter((k) => k.data.itemType === "annotation");
      for (const a of anns) out.push(toAnnotation(a, att));
    }
    const attOrder = new Map(attachments.map((a, i) => [a.key, i]));
    out.sort(
      (a, b) => attOrder.get(a.attachmentKey) - attOrder.get(b.attachmentKey) || a.sortIndex.localeCompare(b.sortIndex)
    );
    return out;
  }
  /** All collections in the personal library, fetched page by page. */
  async listCollections() {
    const all = [];
    const pageSize = 100;
    for (let start = 0; start < 1e4; start += pageSize) {
      const page = await this.get(
        `${this.base()}/collections?format=json&limit=${pageSize}&start=${start}`
      );
      all.push(...page);
      if (page.length < pageSize) break;
    }
    return all;
  }
};
function buildCollectionTree(cols) {
  const byParent = /* @__PURE__ */ new Map();
  const keys = new Set(cols.map((c) => c.key));
  for (const c of cols) {
    const parent = c.data.parentCollection && keys.has(c.data.parentCollection) ? c.data.parentCollection : "";
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(c);
  }
  const build = (parent, depth) => (byParent.get(parent) ?? []).sort((a, b) => a.data.name.localeCompare(b.data.name, void 0, { numeric: true, sensitivity: "base" })).map((c) => ({ collection: c, depth, children: build(c.key, depth + 1) }));
  return build("", 0);
}
var FIELD_LABELS = {
  title: "Title",
  authors: "Authors",
  date: "Date",
  publisher: "Publisher",
  doi: "DOI"
};
var ALL_FIELDS = {
  title: true,
  authors: true,
  date: true,
  publisher: true,
  doi: true
};
var FIELD_PLACEHOLDERS = {
  title: ["title"],
  authors: ["authors", "authorsList"],
  date: ["date"],
  publisher: ["publisher"],
  doi: ["doi", "doiUrl"]
};
function renderTemplateFiltered(tpl, m, include) {
  const excluded = Object.keys(include).filter((k) => !include[k]).flatMap((k) => FIELD_PLACEHOLDERS[k]);
  const kept = tpl.split("\n").filter((line) => {
    const used = [...line.matchAll(/\{\{(\w+)\}\}/g)].map((x) => x[1]);
    return used.length === 0 || used.some((p) => !excluded.includes(p));
  });
  const blanked = {
    ...m,
    title: include.title ? m.title : "",
    authors: include.authors ? m.authors : [],
    date: include.date ? m.date : "",
    publisher: include.publisher ? m.publisher : "",
    doi: include.doi ? m.doi : ""
  };
  return renderTemplate(kept.join("\n"), blanked);
}
var ZOTERO_COLORS = {
  "#ffd400": "Yellow",
  "#ff6666": "Red",
  "#5fb236": "Green",
  "#2ea8e5": "Blue",
  "#a28ae5": "Purple",
  "#e56eee": "Magenta",
  "#f19837": "Orange",
  "#aaaaaa": "Gray"
};
function colorName(hex) {
  return ZOTERO_COLORS[hex.toLowerCase()] ?? hex;
}
function toAnnotation(a, att) {
  const d = a.data;
  let pageIndex = null;
  try {
    const pos = typeof d.annotationPosition === "string" ? JSON.parse(d.annotationPosition) : d.annotationPosition;
    if (pos && typeof pos.pageIndex === "number") pageIndex = pos.pageIndex;
  } catch {
  }
  return {
    key: a.key,
    type: d.annotationType ?? "highlight",
    text: String(d.annotationText ?? "").trim(),
    comment: String(d.annotationComment ?? "").trim(),
    color: String(d.annotationColor ?? "#ffd400").toLowerCase(),
    pageLabel: String(d.annotationPageLabel ?? "").trim(),
    pageIndex,
    sortIndex: String(d.annotationSortIndex ?? ""),
    tags: (d.tags ?? []).map((t) => t.tag).filter(Boolean),
    attachmentKey: att.key,
    attachmentTitle: String(att.data.title ?? "").trim(),
    attachmentType: String(att.data.contentType ?? "")
  };
}
function annotationLink(a) {
  const params = new URLSearchParams();
  if (a.pageIndex !== null) params.set("page", String(a.pageIndex + 1));
  params.set("annotation", a.key);
  const kind = a.attachmentType === "application/pdf" ? "open-pdf" : "open";
  return `zotero://${kind}/library/items/${a.attachmentKey}?${params}`;
}
function annotationValues(a) {
  let text = a.text;
  if (!text && (a.type === "image" || a.type === "ink")) text = `*(${a.type} annotation)*`;
  return {
    text,
    comment: a.comment,
    page: a.pageLabel || (a.pageIndex !== null ? String(a.pageIndex + 1) : ""),
    pageRef: a.pageLabel ? `p. ${a.pageLabel}` : a.pageIndex !== null ? `p. ${a.pageIndex + 1}` : "Open in Zotero",
    color: a.color,
    colorName: colorName(a.color),
    type: a.type,
    tags: a.tags.map((t) => "#" + t.replace(/\s+/g, "-")).join(" "),
    key: a.key,
    attachment: a.attachmentTitle,
    attachmentKey: a.attachmentKey,
    link: annotationLink(a)
  };
}
function renderAnnotation(tpl, a) {
  const v = annotationValues(a);
  const lines = [];
  for (const line of tpl.split("\n")) {
    const used = [...line.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    if (used.length && used.every((k) => !v[k])) continue;
    const prefix = line.match(/^(\s*>\s?)+/)?.[0] ?? "";
    lines.push(
      line.replace(/\{\{(\w+)\}\}/g, (_, k) => (v[k] ?? "").replace(/\r?\n/g, "\n" + prefix))
    );
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function renderAnnotations(list, settings) {
  if (list.length === 0) return "";
  const multiAttachment = new Set(list.map((a) => a.attachmentKey)).size > 1;
  const parts = [];
  if (settings.highlightsHeading.trim()) parts.push(settings.highlightsHeading.trim());
  let lastAtt = "";
  for (const a of list) {
    if (multiAttachment && a.attachmentKey !== lastAtt) {
      parts.push(`**${a.attachmentTitle || "Attachment"}**`);
      lastAtt = a.attachmentKey;
    }
    parts.push(renderAnnotation(settings.highlightTemplate, a));
  }
  return parts.join("\n\n") + "\n";
}

// view.ts
var import_obsidian2 = require("obsidian");
var VIEW_TYPE_ZOTERO = "zotero-item-metadata-view";
var ZoteroPanelView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.targetView = null;
    this.errorEl = null;
    this.dirty = false;
    // user edited fields in the review card
    this.refreshing = false;
    this.timer = null;
    this.searchSeq = 0;
    this.results = [];
    this.selected = null;
    this.draft = null;
    this.include = {
      title: true,
      authors: true,
      date: true,
      publisher: true,
      doi: true
    };
    // Collections
    this.collectionTree = [];
    this.collectionsByKey = /* @__PURE__ */ new Map();
    this.collectionsState = "idle";
    this.expanded = /* @__PURE__ */ new Set();
    this.collectionsOpen = true;
    this.scopeKey = null;
    // null = whole library
    // Highlights of the selected item
    this.hlEl = null;
    this.annotations = [];
    this.annState = "idle";
    this.annSeq = 0;
    this.annPicked = /* @__PURE__ */ new Set();
    this.hiddenColors = /* @__PURE__ */ new Set();
    this.includeHighlights = true;
    this.plugin = plugin;
    this.mode = plugin.settings.insertMode;
  }
  getViewType() {
    return VIEW_TYPE_ZOTERO;
  }
  getDisplayText() {
    return "Zotero metadata";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass("zim-panel");
    const header = root.createDiv("zim-header");
    this.statusEl = header.createDiv("zim-status");
    const refresh = header.createEl("button", { cls: "clickable-icon zim-icon-btn", attr: { "aria-label": "Check connection" } });
    (0, import_obsidian2.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => this.checkConnection();
    this.targetEl = root.createDiv("zim-target");
    const searchWrap = root.createDiv("zim-search");
    const searchIcon = searchWrap.createSpan("zim-search-icon");
    (0, import_obsidian2.setIcon)(searchIcon, "search");
    this.searchInput = searchWrap.createEl("input", {
      type: "search",
      placeholder: "Search title, author or year\u2026"
    });
    this.clearBtn = searchWrap.createEl("button", {
      cls: "zim-search-clear",
      attr: { "aria-label": "Clear search" }
    });
    (0, import_obsidian2.setIcon)(this.clearBtn, "x");
    this.clearBtn.onclick = () => this.newSearch();
    this.searchInput.addEventListener("input", () => {
      this.updateClearButton();
      this.scheduleSearch();
    });
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.results[0]) this.select(this.results[0]);
      if (e.key === "Escape" && this.searchInput.value) {
        e.preventDefault();
        e.stopPropagation();
        this.newSearch();
      }
    });
    this.updateClearButton();
    this.registerDomEvent(root, "keydown", (e) => {
      if (e.key === "Escape" && this.selected && e.target !== this.searchInput) {
        e.preventDefault();
        this.closeDetail();
      }
    });
    this.collectionsEl = root.createDiv("zim-collections");
    const colHead = this.collectionsEl.createDiv("zim-col-head");
    const toggle = colHead.createDiv("zim-col-toggle");
    const chev = toggle.createSpan("zim-chevron");
    (0, import_obsidian2.setIcon)(chev, "chevron-down");
    toggle.createSpan({ text: "Collections" });
    toggle.onclick = () => {
      this.collectionsOpen = !this.collectionsOpen;
      this.collectionsEl.toggleClass("is-collapsed", !this.collectionsOpen);
    };
    const reload = colHead.createEl("button", {
      cls: "clickable-icon zim-icon-btn",
      attr: { "aria-label": "Reload collections" }
    });
    (0, import_obsidian2.setIcon)(reload, "refresh-cw");
    reload.onclick = () => this.loadCollections();
    this.collectionsListEl = this.collectionsEl.createDiv("zim-col-list");
    this.scopeEl = root.createDiv("zim-scope");
    this.resultsEl = root.createDiv("zim-results");
    this.detailEl = root.createDiv("zim-detail");
    this.targetView = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView) ?? this.findAnyMarkdownView();
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.view instanceof import_obsidian2.MarkdownView) {
          this.targetView = leaf.view;
          this.renderTarget();
        }
      })
    );
    this.registerEvent(this.app.workspace.on("file-open", () => this.renderTarget()));
    this.renderTarget();
    this.renderCollections();
    this.renderScope();
    this.renderResults();
    this.renderDetail();
    this.checkConnection();
    this.loadCollections();
  }
  async onClose() {
    if (this.timer) window.clearTimeout(this.timer);
  }
  /** Allow the plugin to push focus into the search box. */
  focusSearch() {
    this.searchInput?.focus();
    this.searchInput?.select();
  }
  // ---------- Data ----------
  findAnyMarkdownView() {
    const leaf = this.app.workspace.getLeavesOfType("markdown")[0];
    return leaf?.view ?? null;
  }
  async checkConnection() {
    this.setStatus("checking");
    try {
      await this.plugin.client.ping();
      this.setStatus("ok");
    } catch (e) {
      this.setStatus("error", e);
    }
  }
  setStatus(state, err) {
    this.statusEl.empty();
    this.statusEl.createSpan({ cls: `zim-dot zim-dot-${state}` });
    this.statusEl.createSpan({
      text: { checking: "Connecting to Zotero\u2026", ok: "Connected to Zotero", error: "Zotero not reachable" }[state]
    });
    this.errorEl?.remove();
    if (state === "error") {
      const { message, fix } = describeError(err);
      this.errorEl = this.statusEl.parentElement.insertAdjacentElement("afterend", createDiv("zim-alert"));
      this.errorEl.createDiv({ cls: "zim-alert-msg", text: message });
      this.errorEl.createDiv({ cls: "zim-alert-fix", text: fix });
    }
  }
  scheduleSearch() {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.runSearch(), 250);
  }
  async runSearch() {
    const q = this.searchInput.value.trim();
    const seq = ++this.searchSeq;
    if (q.length < 2 && !(this.scopeKey && q.length === 0)) {
      this.results = [];
      this.renderResults();
      return;
    }
    this.resultsEl.empty();
    this.resultsEl.createDiv({ cls: "zim-empty", text: q ? "Searching\u2026" : "Loading items\u2026" });
    try {
      const items = await this.plugin.client.search(q, this.scopeKey);
      if (seq !== this.searchSeq) return;
      this.results = items;
      this.setStatus("ok");
      if (this.selected && !items.some((i) => i.key === this.selected.key)) this.closeDetail(false);
      this.renderResults();
    } catch (e) {
      if (seq !== this.searchSeq) return;
      this.results = [];
      this.setStatus("error", e);
      this.renderResults("Search unavailable. See the message above.");
    }
  }
  select(item) {
    this.selected = item;
    this.draft = extractMeta(item, this.plugin.settings);
    this.dirty = false;
    this.annotations = [];
    this.annPicked.clear();
    this.hiddenColors.clear();
    this.renderResults();
    this.renderDetail();
    this.loadAnnotations(item.key);
  }
  /** Close the review card and clear the selection. */
  closeDetail(focusSearch = true) {
    this.selected = null;
    this.draft = null;
    this.dirty = false;
    this.annSeq++;
    this.annotations = [];
    this.annState = "idle";
    this.hlEl = null;
    this.renderResults();
    this.renderDetail();
    if (focusSearch) this.searchInput.focus();
  }
  /** Re-fetch the selected item and its highlights from Zotero. */
  async refreshDetail() {
    if (!this.selected || this.refreshing) return;
    if (this.dirty && !window.confirm("Refreshing reloads the item from Zotero and discards your edits. Continue?")) return;
    const key = this.selected.key;
    this.refreshing = true;
    this.detailEl.addClass("is-refreshing");
    try {
      const fresh = await this.plugin.client.getItem(key);
      if (this.selected?.key !== key) return;
      this.results = this.results.map((r) => r.key === key ? fresh : r);
      this.selected = fresh;
      this.draft = extractMeta(fresh, this.plugin.settings);
      this.dirty = false;
      this.renderResults();
      this.renderDetail();
      this.loadAnnotations(key);
      new import_obsidian2.Notice("Reloaded from Zotero");
    } catch (e) {
      const { message, fix } = describeError(e);
      if (/HTTP 404/.test(message)) {
        new import_obsidian2.Notice("This item no longer exists in Zotero.");
        this.results = this.results.filter((r) => r.key !== key);
        this.closeDetail(false);
      } else {
        new import_obsidian2.Notice(`${message}

${fix}`, 8e3);
      }
    } finally {
      this.refreshing = false;
      this.detailEl.removeClass("is-refreshing");
    }
  }
  /** Start over: clear the query, results and review card, and focus the search box. */
  newSearch() {
    if (this.timer) window.clearTimeout(this.timer);
    this.searchSeq++;
    this.searchInput.value = "";
    this.updateClearButton();
    this.results = [];
    this.closeDetail(false);
    if (this.scopeKey) this.runSearch();
    this.searchInput.focus();
  }
  updateClearButton() {
    this.clearBtn?.toggleClass("is-hidden", !this.searchInput.value);
  }
  async loadAnnotations(itemKey) {
    const seq = ++this.annSeq;
    this.annState = "loading";
    this.renderHighlights();
    try {
      const anns = await this.plugin.client.getAnnotations(itemKey);
      if (seq !== this.annSeq) return;
      this.annotations = anns;
      this.annPicked = new Set(anns.map((a) => a.key));
      this.annState = "loaded";
    } catch (e) {
      if (seq !== this.annSeq) return;
      console.error("[zotero-metadata] annotations", e);
      this.annState = "error";
    }
    this.renderHighlights();
    this.updateInsertButton();
  }
  /** Annotations that will be inserted: picked and not hidden by the colour filter. */
  chosenAnnotations() {
    if (!this.includeHighlights) return [];
    return this.annotations.filter((a) => this.annPicked.has(a.key) && !this.hiddenColors.has(a.color));
  }
  highlightsText() {
    return renderAnnotations(this.chosenAnnotations(), this.plugin.settings);
  }
  // ---------- Collections ----------
  async loadCollections() {
    this.collectionsState = "loading";
    this.renderCollections();
    try {
      const cols = await this.plugin.client.listCollections();
      this.collectionsByKey = new Map(cols.map((c) => [c.key, c]));
      this.collectionTree = buildCollectionTree(cols);
      this.collectionsState = "loaded";
      if (this.scopeKey && !this.collectionsByKey.has(this.scopeKey)) this.setScope(null);
    } catch {
      this.collectionsState = "error";
    }
    this.renderCollections();
    this.renderScope();
  }
  setScope(key) {
    this.scopeKey = key;
    let parent = key ? this.collectionsByKey.get(key)?.data.parentCollection : false;
    while (parent) {
      this.expanded.add(parent);
      parent = this.collectionsByKey.get(parent)?.data.parentCollection ?? false;
    }
    this.searchInput.placeholder = key ? `Search in ${this.collectionsByKey.get(key)?.data.name ?? "collection"}\u2026` : "Search title, author or year\u2026";
    this.renderCollections();
    this.renderScope();
    this.runSearch();
  }
  renderScope() {
    this.scopeEl.empty();
    const col = this.scopeKey ? this.collectionsByKey.get(this.scopeKey) : null;
    if (!col) {
      this.scopeEl.addClass("is-empty");
      return;
    }
    this.scopeEl.removeClass("is-empty");
    const chip = this.scopeEl.createDiv("zim-chip");
    chip.append(iconEl("folder"));
    chip.createSpan({ cls: "zim-chip-label", text: this.collectionPath(col) });
    const x = chip.createEl("button", { cls: "zim-chip-x", attr: { "aria-label": "Search whole library" } });
    (0, import_obsidian2.setIcon)(x, "x");
    x.onclick = () => this.setScope(null);
  }
  collectionPath(col) {
    const parts = [col.data.name];
    let p = col.data.parentCollection;
    while (p) {
      const pc = this.collectionsByKey.get(p);
      if (!pc) break;
      parts.unshift(pc.data.name);
      p = pc.data.parentCollection;
    }
    return parts.join(" / ");
  }
  renderCollections() {
    const list = this.collectionsListEl;
    list.empty();
    const libRow = this.collectionRow(list, {
      key: null,
      name: "My Library",
      icon: "library",
      depth: 0,
      hasChildren: false
    });
    libRow.onclick = () => this.setScope(null);
    if (this.collectionsState === "loading" && this.collectionTree.length === 0) {
      list.createDiv({ cls: "zim-col-note", text: "Loading collections\u2026" });
      return;
    }
    if (this.collectionsState === "error") {
      list.createDiv({ cls: "zim-col-note zim-error", text: "Couldn't load collections." });
      return;
    }
    if (this.collectionsState === "loaded" && this.collectionTree.length === 0) {
      list.createDiv({ cls: "zim-col-note", text: "No collections in your library." });
      return;
    }
    const walk = (nodes) => {
      for (const n of nodes) {
        const c = n.collection;
        const row = this.collectionRow(list, {
          key: c.key,
          name: c.data.name,
          icon: this.expanded.has(c.key) && n.children.length ? "folder-open" : "folder",
          depth: n.depth,
          hasChildren: n.children.length > 0,
          count: c.meta?.numItems
        });
        row.onclick = () => this.setScope(c.key);
        if (n.children.length && this.expanded.has(c.key)) walk(n.children);
      }
    };
    walk(this.collectionTree);
  }
  collectionRow(parent, o) {
    const row = parent.createDiv("zim-col-row");
    row.style.paddingLeft = `${4 + o.depth * 14}px`;
    if (this.scopeKey === o.key) row.addClass("is-active");
    const twisty = row.createSpan("zim-twisty");
    if (o.hasChildren && o.key) {
      const key = o.key;
      (0, import_obsidian2.setIcon)(twisty, this.expanded.has(key) ? "chevron-down" : "chevron-right");
      twisty.addClass("is-clickable");
      twisty.onclick = (e) => {
        e.stopPropagation();
        if (this.expanded.has(key)) this.expanded.delete(key);
        else this.expanded.add(key);
        this.renderCollections();
      };
    }
    const icon = row.createSpan("zim-col-icon");
    (0, import_obsidian2.setIcon)(icon, o.icon);
    row.createSpan({ cls: "zim-col-name", text: o.name });
    if (o.count !== void 0) row.createSpan({ cls: "zim-col-count", text: String(o.count) });
    row.setAttr("title", o.name);
    return row;
  }
  // ---------- Rendering ----------
  renderTarget() {
    this.targetEl.empty();
    const icon = this.targetEl.createSpan("zim-target-icon");
    (0, import_obsidian2.setIcon)(icon, "file-text");
    const file = this.targetView?.file;
    if (file) {
      this.targetEl.createSpan({ text: "Insert into " });
      this.targetEl.createSpan({ cls: "zim-target-name", text: file.basename });
    } else {
      this.targetEl.createSpan({ cls: "zim-muted", text: "Open a note to insert into" });
    }
  }
  renderResults(errorText) {
    this.resultsEl.empty();
    if (errorText) {
      this.resultsEl.createDiv({ cls: "zim-empty zim-error", text: errorText });
      return;
    }
    if (this.results.length === 0) {
      const q = this.searchInput?.value.trim() ?? "";
      let text;
      if (this.scopeKey) text = q ? "No matching items in this collection." : "This collection has no items.";
      else text = q.length < 2 ? "Type at least 2 characters, or pick a collection." : "No matching items.";
      this.resultsEl.createDiv({ cls: "zim-empty", text });
      return;
    }
    for (const item of this.results) {
      const row = this.resultsEl.createDiv("zim-result");
      if (this.selected?.key === item.key) row.addClass("is-selected");
      row.createDiv({ cls: "zim-result-title", text: item.data.title || "(untitled)" });
      const sub = [item.meta?.creatorSummary, item.meta?.parsedDate?.slice(0, 4)].filter(Boolean).join(" \xB7 ");
      const subEl = row.createDiv("zim-result-sub");
      subEl.createSpan({ text: sub });
      subEl.createSpan({ cls: "zim-pill", text: prettyType(item.data.itemType) });
      row.onclick = () => this.select(item);
    }
  }
  renderDetail() {
    const el = this.detailEl;
    el.empty();
    if (!this.draft || !this.selected) {
      el.addClass("is-empty");
      return;
    }
    el.removeClass("is-empty");
    const draft = this.draft;
    const head = el.createDiv("zim-detail-head");
    head.createDiv({ cls: "zim-detail-heading", text: "Review & insert" });
    const tools = head.createDiv("zim-detail-tools");
    const tool = (icon, label, onClick, cls = "") => {
      const b = tools.createEl("button", { cls: `clickable-icon zim-tool ${cls}`, attr: { "aria-label": label } });
      (0, import_obsidian2.setIcon)(b, icon);
      b.onclick = onClick;
      return b;
    };
    tool("external-link", "Open in Zotero", () => window.open(`zotero://select/library/items/${draft.key}`));
    tool("refresh-cw", "Reload from Zotero", () => this.refreshDetail(), "zim-tool-refresh");
    tool("search", "New search", () => this.newSearch());
    tool("x", "Close", () => this.closeDetail());
    const fields = ["title", "authors", "date", "publisher", "doi"];
    for (const key of fields) {
      const row = el.createDiv("zim-field");
      if (!this.include[key]) row.addClass("is-off");
      const labelRow = row.createDiv("zim-field-label");
      const cb = labelRow.createEl("input", { type: "checkbox" });
      cb.checked = this.include[key];
      cb.onchange = () => {
        this.include[key] = cb.checked;
        row.toggleClass("is-off", !cb.checked);
        this.updateInsertButton();
      };
      labelRow.createSpan({ text: FIELD_LABELS[key] });
      if (key === "authors") {
        labelRow.createSpan({ cls: "zim-hint", text: "one per line" });
      }
      const value = key === "authors" ? draft.authors.join("\n") : draft[key];
      if (!value) row.addClass("is-missing");
      if (key === "authors" || key === "title") {
        const ta = row.createEl("textarea", { cls: "zim-input" });
        ta.value = value;
        ta.rows = key === "authors" ? Math.min(Math.max(draft.authors.length, 2), 6) : 2;
        ta.placeholder = "Not available";
        ta.oninput = () => {
          this.dirty = true;
          if (key === "authors") draft.authors = ta.value.split("\n").map((s) => s.trim()).filter(Boolean);
          else draft.title = ta.value;
          row.toggleClass("is-missing", !ta.value.trim());
        };
      } else {
        const input = row.createEl("input", { type: "text", cls: "zim-input" });
        input.value = value;
        input.placeholder = "Not available";
        input.oninput = () => {
          this.dirty = true;
          draft[key] = input.value;
          row.toggleClass("is-missing", !input.value.trim());
        };
      }
    }
    this.hlEl = el.createDiv("zim-hl");
    this.renderHighlights();
    const modeWrap = el.createDiv("zim-mode");
    modeWrap.createDiv({ cls: "zim-mode-label", text: "Insert metadata as" });
    const seg = modeWrap.createDiv("zim-seg");
    const modes = [
      ["frontmatter", "Properties"],
      ["cursor", "Text at cursor"],
      ["both", "Both"]
    ];
    for (const [m, label] of modes) {
      const b = seg.createEl("button", { text: label });
      if (this.mode === m) b.addClass("is-active");
      b.onclick = () => {
        this.mode = m;
        seg.querySelectorAll("button").forEach((x) => x.removeClass("is-active"));
        b.addClass("is-active");
      };
    }
    const actions = el.createDiv("zim-actions");
    const copy = actions.createEl("button", { cls: "zim-btn-secondary" });
    copy.append(iconEl("copy"), document.createTextNode("Copy"));
    copy.onclick = async () => {
      const parts = [this.plugin.renderText(draft, this.include).trim(), this.highlightsText().trim()];
      await navigator.clipboard.writeText(parts.filter(Boolean).join("\n\n") + "\n");
      new import_obsidian2.Notice("Copied to clipboard");
    };
    const insert = actions.createEl("button", { cls: "mod-cta zim-insert" });
    insert.append(iconEl("arrow-down-to-line"), document.createTextNode("Insert into note"));
    insert.onclick = () => this.doInsert();
    this.updateInsertButton();
  }
  renderHighlights() {
    const el = this.hlEl;
    if (!el) return;
    el.empty();
    el.toggleClass("is-off", !this.includeHighlights);
    const head = el.createDiv("zim-hl-head");
    const label = head.createEl("label", { cls: "zim-field-label zim-hl-label" });
    const cb = label.createEl("input", { type: "checkbox" });
    cb.checked = this.includeHighlights;
    cb.onchange = () => {
      this.includeHighlights = cb.checked;
      el.toggleClass("is-off", !cb.checked);
      this.updateInsertButton();
    };
    label.createSpan({ text: "Highlights" });
    if (this.annState === "loaded" && this.annotations.length) {
      const shown = this.annotations.filter((a) => !this.hiddenColors.has(a.color));
      const picked = shown.filter((a) => this.annPicked.has(a.key)).length;
      label.createSpan({ cls: "zim-hl-count", text: `${picked} of ${this.annotations.length}` });
    }
    const reload = head.createEl("button", {
      cls: "clickable-icon zim-icon-btn",
      attr: { "aria-label": "Reload highlights" }
    });
    (0, import_obsidian2.setIcon)(reload, "refresh-cw");
    reload.onclick = () => this.selected && this.loadAnnotations(this.selected.key);
    if (this.annState === "loading") {
      el.createDiv({ cls: "zim-hl-note", text: "Loading highlights\u2026" });
      return;
    }
    if (this.annState === "error") {
      el.createDiv({ cls: "zim-hl-note zim-error", text: "Couldn't load highlights from Zotero." });
      return;
    }
    if (this.annotations.length === 0) {
      el.createDiv({ cls: "zim-hl-note", text: "No highlights or notes on this item's PDF/EPUB files." });
      return;
    }
    const bar = el.createDiv("zim-hl-bar");
    const colors = [...new Set(this.annotations.map((a) => a.color))];
    const dots = bar.createDiv("zim-hl-colors");
    for (const c of colors) {
      const n = this.annotations.filter((a) => a.color === c).length;
      const dot = dots.createEl("button", {
        cls: "zim-hl-dot",
        attr: { "aria-label": `${colorName(c)} (${n}) \u2014 click to show/hide` }
      });
      dot.style.setProperty("--zim-c", c);
      if (this.hiddenColors.has(c)) dot.addClass("is-hidden");
      dot.onclick = () => {
        if (this.hiddenColors.has(c)) this.hiddenColors.delete(c);
        else this.hiddenColors.add(c);
        this.renderHighlights();
        this.updateInsertButton();
      };
    }
    const sel = bar.createDiv("zim-hl-sel");
    const all = sel.createEl("a", { text: "All" });
    all.onclick = () => {
      this.annotations.forEach((a) => this.annPicked.add(a.key));
      this.renderHighlights();
      this.updateInsertButton();
    };
    sel.createSpan({ text: " \xB7 " });
    const none = sel.createEl("a", { text: "None" });
    none.onclick = () => {
      this.annPicked.clear();
      this.renderHighlights();
      this.updateInsertButton();
    };
    const list = el.createDiv("zim-hl-list");
    let lastAtt = "";
    const multiAtt = new Set(this.annotations.map((a) => a.attachmentKey)).size > 1;
    for (const a of this.annotations) {
      if (this.hiddenColors.has(a.color)) continue;
      if (multiAtt && a.attachmentKey !== lastAtt) {
        list.createDiv({ cls: "zim-hl-att", text: a.attachmentTitle || "Attachment" });
        lastAtt = a.attachmentKey;
      }
      const row = list.createEl("label", { cls: "zim-hl-row" });
      row.style.setProperty("--zim-c", a.color);
      if (!this.annPicked.has(a.key)) row.addClass("is-unpicked");
      const rcb = row.createEl("input", { type: "checkbox" });
      rcb.checked = this.annPicked.has(a.key);
      rcb.onchange = () => {
        if (rcb.checked) this.annPicked.add(a.key);
        else this.annPicked.delete(a.key);
        row.toggleClass("is-unpicked", !rcb.checked);
        const count = el.querySelector(".zim-hl-count");
        if (count) {
          const shown = this.annotations.filter((x) => !this.hiddenColors.has(x.color));
          count.textContent = `${shown.filter((x) => this.annPicked.has(x.key)).length} of ${this.annotations.length}`;
        }
        this.updateInsertButton();
      };
      const body = row.createDiv("zim-hl-body");
      if (a.text) body.createDiv({ cls: "zim-hl-text", text: a.text });
      else if (a.type === "image" || a.type === "ink")
        body.createDiv({ cls: "zim-hl-text zim-muted", text: `(${a.type} annotation)` });
      if (a.comment) {
        const c = body.createDiv("zim-hl-comment");
        c.append(iconEl("message-square"));
        c.createSpan({ text: a.comment });
      }
      const meta = [a.pageLabel ? `p. ${a.pageLabel}` : "", a.type !== "highlight" ? a.type : "", ...a.tags.map((t) => "#" + t)].filter(Boolean).join(" \xB7 ");
      if (meta) body.createDiv({ cls: "zim-hl-meta", text: meta });
    }
  }
  updateInsertButton() {
    const btn = this.detailEl.querySelector(".zim-insert");
    if (btn) btn.disabled = !Object.values(this.include).some(Boolean) && this.chosenAnnotations().length === 0;
  }
  async doInsert() {
    if (!this.draft) return;
    const view = this.targetView;
    if (!view || !view.file || !view.leaf.parent) {
      new import_obsidian2.Notice("Open a note to insert into first.");
      return;
    }
    await this.plugin.insertMeta(this.draft, view.editor, view, this.mode, this.include, this.highlightsText());
  }
};
function iconEl(name) {
  const s = createSpan("zim-btn-icon");
  (0, import_obsidian2.setIcon)(s, name);
  return s;
}
function prettyType(t) {
  return t.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// main.ts
var ZoteroSearchModal = class extends import_obsidian3.SuggestModal {
  constructor(app, client, onPick) {
    super(app);
    this.client = client;
    this.onPick = onPick;
    this.timer = null;
    this.lastError = "";
    this.setPlaceholder("Search Zotero by title, author or year\u2026");
    this.emptyStateText = "Type at least 2 characters";
  }
  getSuggestions(query) {
    if (this.timer) window.clearTimeout(this.timer);
    if (query.trim().length < 2) {
      this.emptyStateText = "Type at least 2 characters";
      return Promise.resolve([]);
    }
    return new Promise((resolve) => {
      this.timer = window.setTimeout(async () => {
        try {
          const items = await this.client.search(query.trim());
          this.emptyStateText = items.length ? "" : "No matching items";
          resolve(items);
        } catch (e) {
          const { message, fix } = describeError(e);
          const msg = `${message} ${fix}`;
          this.emptyStateText = msg;
          if (this.lastError !== msg) console.error("[zotero-metadata]", e);
          this.lastError = msg;
          resolve([]);
        }
      }, 250);
    });
  }
  renderSuggestion(item, el) {
    el.createDiv({ text: item.data.title || "(untitled)", cls: "zotero-meta-title" });
    const sub = [item.meta?.creatorSummary, item.meta?.parsedDate?.slice(0, 4), item.data.itemType].filter(Boolean).join(" \xB7 ");
    el.createEl("small", { text: sub, cls: "zotero-meta-sub" });
  }
  onChooseSuggestion(item) {
    this.onPick(item);
  }
};
var ZoteroMetadataPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    await this.loadSettings();
    this.client = new ZoteroClient(() => this.settings.port);
    this.registerView(VIEW_TYPE_ZOTERO, (leaf) => new ZoteroPanelView(leaf, this));
    this.addCommand({
      id: "open-zotero-panel",
      name: "Open Zotero panel",
      callback: () => this.activatePanel()
    });
    this.addCommand({
      id: "insert-zotero-metadata",
      name: "Quick insert metadata from Zotero item",
      editorCallback: (editor, ctx) => {
        new ZoteroSearchModal(this.app, this.client, (item) => this.insert(item, editor, ctx)).open();
      }
    });
    this.addCommand({
      id: "insert-zotero-highlights",
      name: "Quick insert highlights from Zotero item",
      editorCallback: (editor, ctx) => {
        new ZoteroSearchModal(this.app, this.client, async (item) => {
          try {
            const anns = await this.client.getAnnotations(item.key);
            if (!anns.length) {
              new import_obsidian3.Notice("That item has no highlights or notes.");
              return;
            }
            const none = { title: false, authors: false, date: false, publisher: false, doi: false };
            await this.insertMeta(
              extractMeta(item, this.settings),
              editor,
              ctx,
              this.settings.insertMode,
              none,
              renderAnnotations(anns, this.settings)
            );
          } catch (e) {
            const { message, fix } = describeError(e);
            new import_obsidian3.Notice(`${message}

${fix}`, 1e4);
          }
        }).open();
      }
    });
    this.addRibbonIcon("book-open", "Open Zotero panel", () => this.activatePanel());
    this.addSettingTab(new ZoteroMetaSettingTab(this.app, this));
  }
  async activatePanel() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_ZOTERO)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_TYPE_ZOTERO, active: true });
    }
    await workspace.revealLeaf(leaf);
    leaf.view.focusSearch?.();
  }
  renderText(meta, include = ALL_FIELDS) {
    return renderTemplateFiltered(this.settings.template, meta, include);
  }
  async insert(item, editor, view) {
    await this.insertMeta(extractMeta(item, this.settings), editor, view, this.settings.insertMode, ALL_FIELDS);
  }
  async insertMeta(meta, editor, view, mode, include, highlights = "") {
    const anyField = Object.values(include).some(Boolean);
    const atCursor = [];
    if (anyField && (mode === "cursor" || mode === "both")) atCursor.push(this.renderText(meta, include).trim());
    if (highlights.trim()) {
      if (this.settings.highlightsPlacement === "end") {
        const last = editor.lastLine();
        const lastText = editor.getLine(last);
        const sep = lastText.trim() ? "\n\n" : editor.getValue().trim() ? "\n" : "";
        editor.replaceRange(sep + highlights.trim() + "\n", { line: last, ch: lastText.length });
      } else {
        atCursor.push(highlights.trim());
      }
    }
    if (atCursor.length) editor.replaceSelection(atCursor.join("\n\n") + "\n");
    if (anyField && (mode === "frontmatter" || mode === "both")) {
      const file = view.file;
      if (!(file instanceof import_obsidian3.TFile)) return;
      if (view instanceof import_obsidian3.MarkdownView) await view.save();
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        if (include.title) fm.title = meta.title;
        if (include.authors) fm.authors = meta.authors;
        if (include.date) fm.date = meta.date;
        if (include.publisher) fm.publisher = meta.publisher;
        if (include.doi) fm.doi = meta.doi;
        fm["zotero-key"] = meta.key;
      });
    }
    new import_obsidian3.Notice(`Inserted: ${meta.title || meta.key}${highlights.trim() ? " + highlights" : ""}`);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var ZoteroMetaSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const save = () => this.plugin.saveSettings();
    new import_obsidian3.Setting(containerEl).setName("Insert as").setDesc("Where the metadata goes in the current note.").addDropdown(
      (d) => d.addOption("frontmatter", "Note properties (frontmatter)").addOption("cursor", "Text at cursor (template)").addOption("both", "Both").setValue(s.insertMode).onChange(async (v) => {
        s.insertMode = v;
        await save();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Text template").setDesc(
      "Used for 'Text at cursor'. Placeholders: {{title}} {{date}} {{publisher}} {{doi}} {{doiUrl}} {{authors}} {{authorsList}} {{key}} {{zoteroLink}}"
    ).addTextArea((t) => {
      t.setValue(s.template).onChange(async (v) => {
        s.template = v;
        await save();
      });
      t.inputEl.rows = 7;
      t.inputEl.style.width = "100%";
    });
    containerEl.createEl("h3", { text: "Highlights" });
    new import_obsidian3.Setting(containerEl).setName("Where to put highlights").addDropdown(
      (d) => d.addOption("cursor", "At the cursor").addOption("end", "At the end of the note").setValue(s.highlightsPlacement).onChange(async (v) => {
        s.highlightsPlacement = v;
        await save();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Highlights heading").setDesc("Added above the highlights. Leave empty for none.").addText(
      (t) => t.setValue(s.highlightsHeading).onChange(async (v) => {
        s.highlightsHeading = v;
        await save();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Highlight template").setDesc(
      "Used for each highlight. Placeholders: {{text}} {{comment}} {{page}} {{pageRef}} {{color}} {{colorName}} {{type}} {{tags}} {{link}} {{attachment}} {{key}}. Lines whose placeholders are all empty are left out."
    ).addTextArea((t) => {
      t.setValue(s.highlightTemplate).onChange(async (v) => {
        s.highlightTemplate = v;
        await save();
      });
      t.inputEl.rows = 5;
      t.inputEl.style.width = "100%";
    });
    containerEl.createEl("h3", { text: "Formatting" });
    new import_obsidian3.Setting(containerEl).setName("Author name format").addDropdown(
      (d) => d.addOption("last-first", "Last, First").addOption("first-last", "First Last").setValue(s.authorFormat).onChange(async (v) => {
        s.authorFormat = v;
        await save();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Normalize dates").setDesc("Use Zotero's parsed date (e.g. 2021-03-15) instead of the raw date text.").addToggle(
      (t) => t.setValue(s.useParsedDate).onChange(async (v) => {
        s.useParsedDate = v;
        await save();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Zotero port").setDesc("Default 23119. Only change this if you changed it in Zotero.").addText(
      (t) => t.setValue(String(s.port)).onChange(async (v) => {
        const n = parseInt(v, 10);
        if (!isNaN(n)) {
          s.port = n;
          await save();
        }
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Test connection").addButton(
      (b) => b.setButtonText("Test").onClick(async () => {
        try {
          await this.plugin.client.ping();
          new import_obsidian3.Notice("Connected to Zotero \u2714");
        } catch (e) {
          const { message, fix } = describeError(e);
          new import_obsidian3.Notice(`${message}

${fix}`, 1e4);
        }
      })
    );
  }
};
