# Q&A Generator for Obsidian

Reads the current note and generates **questions & answers** into a new note named **`QA_<note name>`**.
Runs entirely on your own computer — **normal CPU, no GPU, no cloud** — on **Windows, macOS and Linux**.

## Two engines

| | Built-in NLP (default) | Local AI model |
|---|---|---|
| Setup | None | Install Ollama (or LM Studio / llama.cpp / GPT4All) + one small model |
| Speed | Milliseconds | ~20 s – 2 min per note on a typical CPU |
| Quality | Good on structured English notes | Natural, varied questions; understands context |
| Languages | English | Any language the model knows |
| Internet | Never | Never (only `localhost`) |

If the local AI is unreachable or fails, the plugin automatically falls back to the built-in NLP engine (configurable).

### What the built-in NLP engine generates
- **Definitions** — “Chlorophyll is a green pigment…” → *What is chlorophyll?*
- **Key terms** — `- **Stomata**: tiny pores…` → *What is meant by “Stomata”?*
- **Steps** — numbered lists → *What are the steps of “Stages”, in order?*
- **Lists** — bullet lists → *List the main points about “…”.*
- **Cause & effect** — “…because…”, “…due to…”, “…therefore…” → *Why is it that…?*
- **Facts** — dates, years, numbers, percentages → fill-in-the-blank
- **Cloze** — most important keyword of high-scoring sentences (TF-based ranking)
- **Section summaries** — key ideas per heading

It ignores frontmatter, code blocks, tables, comments (`%% %%`, `<!-- -->`), math blocks and embeds, and resolves `[[links|aliases]]`.

## Installation

### Manual (recommended until published)
1. Download `qa-generator-1.2.0.zip` and unzip it.
2. Copy the `qa-generator` folder into your vault at `<vault>/.obsidian/plugins/` 
   (on macOS/Linux the `.obsidian` folder is hidden — press `Cmd+Shift+.` in Finder or `Ctrl+H` in most Linux file managers).
3. In Obsidian: **Settings → Community plugins** → turn off Restricted mode if needed → reload → enable **Q&A Generator**.

The folder must contain `manifest.json`, `main.js` and `styles.css`.

### Build from source
```bash
npm install
npm run build     # produces main.js
npm test          # runs engine tests (NLP, formats, mock Ollama/OpenAI servers)
```

## Usage
Open a note, then any of:
- **Sidebar panel** — click the document-with-question-mark icon in the left ribbon (or run **Open Q&A Generator panel**). The panel opens in the right sidebar, shows the current note, lets you pick the engine and number of questions, and has a **Generate Q&A** button with live progress and a link to the result.
- Command palette (`Ctrl/Cmd+P`) → **Q&A Generator: Generate Q&A from current note** (assign a hotkey in Settings → Hotkeys)
- Right-click the note (file explorer or editor) → **Generate Q&A note**

The plugin creates `QA_<note>.md` next to the original (or in your chosen output folder) and opens it.
A second command, **…(built-in NLP)**, always uses the offline engine.

## Flashcards

Turn the generated questions into flashcards, then study them inside Obsidian or export them.

**Create flashcards** in any of these ways:
- Tick **Also create flashcards** in the sidebar panel (or the setting *Create flashcards automatically*). Cards are then made every time you generate.
- Press **Create flashcards** in the sidebar panel.
- Command palette → **Create flashcards from Q&A note**.
- Right-click a `QA_` note, or its source note → **Create flashcards**.

When created from an existing `QA_` note, cards are read from that note, so any questions you edited, deleted or added yourself are respected. All four QA formats are supported.

**Outputs**, chosen in settings:
- **`Flashcards_<note>.md`** (on by default): a deck for the *Spaced Repetition* community plugin. Single-line cards use `Question::Answer` and multi-line answers use the `?` separator. The deck tag (default `#flashcards`, e.g. `#flashcards/biology`) becomes the deck name.
- **`Flashcards_<note>.txt`**: an Anki import file. In Anki, choose File → Import and select it. It is tab-separated for the *Basic* note type, with tags included. Obsidian only lists `.txt` files in the file explorer if *Settings → Files and links → Detect all file extensions* is on, but the file is always in your vault folder.

**Study in Obsidian:** press **Study** in the panel, or run **Study flashcards**. A flip-card session opens:
- Click the card, or press `Space`, to show the answer.
- **Again** (`1` / `←`) sends the card to the back of the queue.
- **Got it** (`2` / `→` / `Space`) marks it learned.
- At the end you see your first-try score, and can review only the missed cards.
- Shuffle can be toggled.

## Setting up the local AI engine (optional)

### Ollama (easiest — Windows, macOS, Linux)
1. Install from <https://ollama.com/download>.
2. Pull a CPU-friendly model:
   ```bash
   ollama pull qwen2.5:3b      # good balance (≈2 GB, 8 GB RAM)
   # alternatives:
   ollama pull qwen2.5:1.5b    # fastest, older/low-RAM machines (≈1 GB)
   ollama pull llama3.2:3b     # good English quality
   ollama pull phi3.5          # best quality, slower (≈2.2 GB)
   ```
3. In plugin settings choose **Engine → Local AI model**, provider **Ollama**, URL `http://localhost:11434`, model name, then press **Test connection**.

Ollama runs as a background service after install. All inference is on CPU by default when no GPU is present.

### OpenAI-compatible local servers
Choose provider **OpenAI-compatible** and set the URL (including `/v1`):

| App | Default URL |
|---|---|
| LM Studio (start the Local Server) | `http://localhost:1234/v1` |
| llama.cpp `llama-server -m model.gguf` | `http://localhost:8080/v1` |
| GPT4All (enable API server) | `http://localhost:4891/v1` |
| Jan | `http://localhost:1337/v1` |

### Performance tips for CPU
- Smaller models (1.5B–3B, Q4 quantization) are much faster than 7B+.
- Reduce **Chunk size** to ~3000 characters on slow machines; long notes are processed chunk by chunk.
- Increase **Timeout** if long notes time out (default 600 s).

## Settings
- **Engine**, **Number of questions** (3–50)
- NLP: fill-in-the-blank and section-summary toggles
- Local AI: provider, URL, model, API key (optional), temperature, chunk size, context window, timeout, extra instructions, fallback to NLP
- Output: format, output folder, overwrite vs. numbered copy, group by section, tags, open after creation
- Flashcards: create automatically, Spaced Repetition deck note, Anki import file, deck tag, flashcards folder, shuffle when studying

### Output formats
- **Collapsible callouts** (default) — answers hidden until you click, ideal for self-testing
- **Headings with answers**
- **Spaced Repetition flashcards** — compatible with the *Spaced Repetition* community plugin (`question` / `?` / `answer`)
- **Table**

Example (callout format):
```markdown
> [!question]- 2. What is chlorophyll?
> Chlorophyll is a green pigment that absorbs red and blue light.
```

## Privacy
Your notes never leave your machine. The built-in engine makes no network calls; the AI engine only talks to the server URL you configure (normally `localhost`).

## Project structure
```
src/main.ts      plugin entry: commands, menus, note creation
src/nlp.ts       offline NLP question generator
src/llm.ts       local AI client (Ollama + OpenAI-compatible), robust JSON parsing, chunking
src/format.ts    output note rendering
src/settings.ts  settings tab
src/view.ts      sidebar panel with the Generate / flashcard buttons
src/flashcards.ts parse QA notes into cards; Spaced Repetition + Anki output
src/study.ts     flip-card study modal
test/            Node test suite + sample notes
```

## License
MIT
