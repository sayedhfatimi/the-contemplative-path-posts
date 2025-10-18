// slugifyFrontmatterTags.js
// QuickAdd User Script: Slugify frontmatter "tags" (scope: Vault | Current file)

module.exports = async (params, settings) => {
  const app = params.app;
  const vault = app.vault;

  // Safe notifier (uses Notice if available, else console.log)
  const notify = (msg, timeout = 5000) => {
    try {
      if (
        typeof window !== 'undefined' &&
        typeof window.Notice === 'function'
      ) {
        new window.Notice(msg, timeout);
      } else if (typeof Notice === 'function') {
        new Notice(msg, timeout);
      } else {
        console.log(`[Slugify Tags] ${msg}`);
      }
    } catch {
      console.log(`[Slugify Tags] ${msg}`);
    }
  };

  const scope = (settings && settings.scope) || 'Vault'; // "Vault" | "Current file"
  const dryRun = !!(settings && settings.dryRun);

  // Collect target files based on scope
  let targetFiles = [];
  if (scope === 'Current file') {
    const active = app.workspace.getActiveFile();
    if (!active) return notify('No active file to process.', 4000);
    if (!active.path.toLowerCase().endsWith('.md'))
      return notify('Active file is not Markdown.', 5000);
    targetFiles = [active];
  } else {
    targetFiles = vault.getMarkdownFiles();
  }

  // Helpers
  const slugify = (s) => {
    if (typeof s !== 'string') return '';
    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/\+/g, ' plus ')
      .toLowerCase()
      .replace(/[^a-z0-9\/\-\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-')
      .replace(/-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  };

  const extractFrontmatter = (content) => {
    // Handle both LF and CRLF
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
    if (!match) return { fmText: null, body: content, raw: content };
    return {
      fmText: match[1],
      body: content.slice(match[0].length),
      raw: content,
    };
  };

  const parseTagsFromFrontmatter = (fmText) => {
    if (!fmText) return null;

    // Quick existence check
    if (!/^tags\s*:/m.test(fmText)) return null;

    // Inline array
    const inlineArrRe = /^tags\s*:\s*\[([^\]]*)\]/m;
    const inlineMatch = fmText.match(inlineArrRe);
    if (inlineMatch) {
      const raw = inlineMatch[1].trim();
      const items = splitInlineList(raw);
      return {
        style: 'inline',
        range: rangeFromMatch(fmText, inlineMatch),
        items,
      };
    }

    // Block list
    const blockRe = /^tags\s*:\s*\r?\n((?:[ \t]*- .*(?:\r?\n|$))+)/m;
    const blockMatch = fmText.match(blockRe);
    if (blockMatch) {
      const listBlock = blockMatch[1];
      const items = [];
      const indentedItemRe = /^[ \t]*-\s+(.*)$/gm;
      let m;
      while ((m = indentedItemRe.exec(listBlock)) !== null)
        items.push(m[1].trim());
      const firstItemIndentMatch = listBlock.match(/^([ \t]*)-\s+/m);
      const itemIndent = firstItemIndentMatch ? firstItemIndentMatch[1] : '  ';
      return {
        style: 'block',
        range: rangeFromMatch(fmText, blockMatch),
        items,
        itemIndent,
      };
    }

    // Single line
    const singleLineRe = /^tags\s*:\s*([^\n\r]+)$/m;
    const singleMatch = fmText.match(singleLineRe);
    if (singleMatch) {
      const val = singleMatch[1].trim();
      let items;
      if (val.startsWith('[') && val.endsWith(']'))
        items = splitInlineList(val.slice(1, -1));
      else if (val.includes(','))
        items = val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      else items = val ? [val] : [];
      return {
        style: 'single',
        range: rangeFromMatch(fmText, singleMatch),
        items,
      };
    }

    return null;
  };

  function splitInlineList(raw) {
    const result = [];
    let cur = '',
      inS = false,
      inD = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === "'" && !inD) {
        inS = !inS;
        cur += ch;
        continue;
      }
      if (ch === '"' && !inS) {
        inD = !inD;
        cur += ch;
        continue;
      }
      if (ch === ',' && !inS && !inD) {
        pushTrimmed(cur, result);
        cur = '';
        continue;
      }
      cur += ch;
    }
    pushTrimmed(cur, result);
    return result.map(stripQuotes);
  }
  function stripQuotes(s) {
    const t = s.trim();
    return (t.startsWith("'") && t.endsWith("'")) ||
      (t.startsWith('"') && t.endsWith('"'))
      ? t.slice(1, -1)
      : t;
  }
  function pushTrimmed(s, arr) {
    const t = s.trim();
    if (t) arr.push(t);
  }
  function rangeFromMatch(text, match) {
    const start = match.index;
    return [start, start + match[0].length];
  }

  let scanned = 0,
    changed = 0,
    skipped = 0;
  const updates = [];

  for (const file of targetFiles) {
    scanned++;
    const content = await vault.read(file);
    const { fmText, body } = extractFrontmatter(content);
    if (!fmText) {
      skipped++;
      continue;
    }

    const parsed = parseTagsFromFrontmatter(fmText);
    if (!parsed || !parsed.items?.length) {
      skipped++;
      continue;
    }

    const original = parsed.items.slice();

    // Build slugified + deduped list
    const newItems = [];
    const seen = new Set();
    for (const t of original) {
      const s = slugify(t);
      if (s && !seen.has(s)) {
        seen.add(s);
        newItems.push(s);
      }
    }

    // ✅ Correct "unchanged" logic:
    // - If *any* original item changes when slugified -> we must update.
    // - Or if deduping changed the list length/order -> we must update.
    const anyItemChanged = original.some((t, i) => slugify(t) !== t);
    const sameLength = newItems.length === original.length;
    const sameOrderIfLowercased =
      sameLength && original.every((t, i) => slugify(t) === newItems[i]);

    const unchanged = !anyItemChanged && sameOrderIfLowercased;

    if (unchanged) {
      skipped++;
      continue;
    }

    // Rebuild snippet preserving style
    let newSnippet = '';
    if (parsed.style === 'inline') {
      newSnippet = `tags: [${newItems.join(', ')}]`;
    } else if (parsed.style === 'block') {
      const indent = parsed.itemIndent || '  ';
      newSnippet =
        `tags:\n` + newItems.map((it) => `${indent}- ${it}`).join('\n') + '\n';
    } else {
      newSnippet = `tags: [${newItems.join(', ')}]`;
    }

    const [start, end] = parsed.range;
    const newFmText = fmText.slice(0, start) + newSnippet + fmText.slice(end);
    const newContent = `---\n${newFmText}\n---\n${body}`;
    updates.push({ file, newContent, path: file.path });
  }

  if (!updates.length) {
    return notify(
      `Slugify Tags: scope=${scope}. Scanned ${scanned}, no changes needed.`,
      5000
    );
  }

  if (dryRun) {
    const list = updates
      .slice(0, 10)
      .map((u) => `• ${u.path}`)
      .join('\n');
    return notify(
      `Slugify Tags (dry run): ${
        updates.length
      } file(s) would change.\n${list}${
        updates.length > 10 ? '\n…(more)' : ''
      }`,
      9000
    );
  }

  for (const u of updates) {
    await vault.modify(app.vault.getAbstractFileByPath(u.path), u.newContent);
    changed++;
  }

  notify(
    `Slugify Tags: scope=${scope}. Scanned ${scanned}, updated ${changed}, skipped ${skipped}.`,
    7000
  );
};

// QuickAdd settings UI
module.exports.settings = {
  name: 'Slugify frontmatter tags',
  author: 'Sayed Hamid Fatimi',
  options: {
    scope: {
      type: 'dropdown',
      default: 'Vault',
      options: ['Vault', 'Current file'],
      description:
        'Run on the entire local vault or just the currently active file.',
    },
    dryRun: {
      type: 'toggle',
      default: true,
      description: 'Preview changes without modifying files.',
    },
  },
};
