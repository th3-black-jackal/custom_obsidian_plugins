\# Zotero Item Metadata (Obsidian plugin)



Search your Zotero library from Obsidian and insert an item's \*\*Title, Date, Publisher, DOI and Authors\*\* into the current note.



\## Requirements

\- Zotero 7 (desktop), running

\- In Zotero: \*\*Settings → Advanced → "Allow other applications on this computer to communicate with Zotero"\*\* must be checked (this enables the local API at `http://127.0.0.1:23119`)



\## Install

1\. Unzip `zotero-item-metadata.zip` into `<your vault>/.obsidian/plugins/` (you should end up with `.obsidian/plugins/zotero-item-metadata/main.js`).

2\. In Obsidian: \*\*Settings → Community plugins\*\* → reload, then enable \*\*Zotero Item Metadata\*\*.



\## Use



\### Side panel

Click the \*\*book icon\*\* in the left ribbon, or run \*\*"Open Zotero panel"\*\* from the command palette. The panel opens in the right sidebar:



1\. The status dot shows whether Zotero is reachable. The refresh button rechecks it.

2\. "Insert into …" shows the note the metadata will go into. This is the last note you clicked in.

3\. Type in the search box to search your library by title, author or year. Press Enter to pick the top result. Typing a new search replaces the results, and closes the review card if its item isn't among them. The \*\*×\*\* in the search box, or \*\*Esc\*\* while typing, clears the search.

4\. Under the search box, \*\*Collections\*\* lists every collection in your library as a tree:

&#x20;  - Click a collection to list its items. Typing then searches only inside that collection.

&#x20;  - Click the arrow beside a collection to show or hide its subcollections. The number on the right is how many items it holds.

&#x20;  - A chip above the results shows which collection you're in. Click its \*\*×\*\*, or \*\*My Library\*\*, to search the whole library again.

&#x20;  - Click the header to collapse the list, and the refresh icon to reload it after changing collections in Zotero.

5\. Click a result to open the \*\*Review \& insert\*\* card. There you can:

&#x20;  - edit any field before inserting (authors go one per line),

&#x20;  - untick fields you don't want,

&#x20;  - choose \*\*Properties\*\*, \*\*Text at cursor\*\* or \*\*Both\*\*,

&#x20;  - click \*\*Insert into note\*\*, or \*\*Copy\*\* to put the text version on your clipboard,

&#x20;  - use the buttons in the card's top-right corner:

&#x20;    - \*\*Open in Zotero\*\* jumps to the item in Zotero.

&#x20;    - \*\*Reload\*\* fetches the item and its highlights again, for example after you've edited it in Zotero. It asks first if you've changed any fields.

&#x20;    - \*\*New search\*\* clears the search box, the results and the card, ready to search again.

&#x20;    - \*\*Close\*\* hides the card. Your results stay, so you can pick another item. \*\*Esc\*\* does the same.

6\. Below the fields, \*\*Highlights\*\* lists every highlight, underline, note and image annotation on the item's PDF and EPUB files, in reading order:

&#x20;  - Untick individual highlights, or use \*\*All\*\* / \*\*None\*\*.

&#x20;  - Click a colour dot to hide or show highlights of that colour.

&#x20;  - Untick the \*\*Highlights\*\* checkbox to insert metadata only, or untick all the fields to insert highlights only.

&#x20;  - Highlights always go into the note body, at the cursor or at the end of the note (see settings). \*\*Copy\*\* includes them too.



\### Quick insert

Run \*\*"Quick insert metadata from Zotero item"\*\* from the command palette for a one-step search popup. It inserts all fields using the mode set in the plugin's settings.



Run \*\*"Quick insert highlights from Zotero item"\*\* to pick an item and insert all of its highlights.



\### Output

By default the data is written as note properties:



```yaml

\---

title: Attention Is All You Need

authors:

&#x20; - Vaswani, Ashish

date: 2017-06-12

publisher: Curran

doi: 10.5555/3295222

zotero-key: ABC123

\---

```



The default insert mode and the text template are set in the plugin's settings. In the text template, any line whose fields you unticked in the panel is left out.



Highlights are inserted like this by default. The page number links back to the highlight in Zotero's reader:



```markdown

\## Highlights



> \[!quote] \[p. 2](zotero://open-pdf/library/items/…)

> The Transformer is the first transduction model relying entirely on self-attention…



Core claim — compare with ConvS2S

```



The heading, the template for each highlight, and where they go are all in the plugin's settings. Highlight placeholders: `{{text}} {{comment}} {{page}} {{pageRef}} {{color}} {{colorName}} {{type}} {{tags}} {{link}} {{attachment}} {{key}}`. A line is left out when all of its placeholders are empty, for example the comment line when a highlight has no comment.



Metadata template placeholders: `{{title}} {{date}} {{publisher}} {{doi}} {{doiUrl}} {{authors}} {{authorsList}} {{key}} {{zoteroLink}}`



\## Notes

\- \*\*Authors:\*\* only creators with the role "author" are included. If an item has none, the plugin falls back to all creators, such as editors.

\- \*\*Publisher:\*\* for theses, reports and similar items, the equivalent field is used (university, institution, label, distributor, and so on).

\- \*\*DOI:\*\* for item types without a DOI field, the plugin reads a `DOI: …` line from the Extra field.

\- \*\*Collections:\*\* only collections in My Library are listed, not group libraries. Opening a collection lists up to 100 items; type to search within it if it has more.

\- \*\*Highlights:\*\* these are annotations made in Zotero's own reader. Highlights stored inside a PDF file by another app only appear if you've imported them into Zotero (right-click the PDF → Import Annotations).

\- \*\*Platform:\*\* desktop only, since it talks to Zotero on the same computer.



\## Build from source

```

npm install

npm run build

```

