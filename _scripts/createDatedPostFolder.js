// File: createDatedPostFolder.js
// QuickAdd → Manage Macros → Add “User script” → point to this file
module.exports = async (params) => {
  const { app, quickAddApi } = params;
  const title = await quickAddApi.inputPrompt("Post title");
  if (!title) return;

  // slugify (accent-strip, lowercase, kebab)
  const slug = title
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");

  const date = window.moment().format("YYYY-MM-DD"); // uses Obsidian’s moment
  const folder = `${date}-${slug}`;                  // adjust base path if you like
  const filePath = `${folder}/post.md`;

  // ensure folder exists
  try { await app.vault.createFolder(folder); } catch (_) { /* already exists */ }

  // create blank post.md if it isn't there yet
  if (!app.vault.getAbstractFileByPath(filePath)) {
    await app.vault.create(filePath, "");
  }

  // open the new file
  const file = app.vault.getAbstractFileByPath(filePath);
  if (file) await app.workspace.getLeaf(true).openFile(file);
};
