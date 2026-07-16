const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createAttachmentStore(getBasePath) {
  const attachmentsRoot = () => path.join(getBasePath(), 'attachments');
  const templatesRoot = () => path.join(attachmentsRoot(), 'templates');

  async function ensureDir(dir) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  function sanitizeFileName(name) {
    return (name || 'file').replace(/[/\\?%*:|"<>]/g, '-');
  }

  function resolveAttachmentDir(attachment) {
    if (attachment?.storageKind === 'template') {
      return path.join(templatesRoot(), attachment.id);
    }
    return path.join(attachmentsRoot(), attachment.id);
  }

  function getAttachmentPath(attachment) {
    return path.join(resolveAttachmentDir(attachment), attachment.storedName);
  }

  async function copyFileToDir(sourcePath, dir, originalName) {
    await ensureDir(dir);
    const storedName = sanitizeFileName(originalName);
    const destPath = path.join(dir, storedName);
    await fs.promises.copyFile(sourcePath, destPath);
    const stat = await fs.promises.stat(destPath);
    return { storedName, size: stat.size };
  }

  async function copyFileToAttachment(sourcePath, attachmentId, originalName) {
    const dir = path.join(attachmentsRoot(), attachmentId);
    const { storedName, size } = await copyFileToDir(sourcePath, dir, originalName);
    return {
      id: attachmentId,
      name: originalName,
      storedName,
      size,
      addedAt: Date.now(),
    };
  }

  async function pickAndCopyFiles(filePaths) {
    const results = [];
    for (const sourcePath of filePaths) {
      const id = crypto.randomUUID();
      const originalName = path.basename(sourcePath);
      const meta = await copyFileToAttachment(sourcePath, id, originalName);
      results.push(meta);
    }
    return results;
  }

  async function copyAttachment(attachment) {
    const srcPath = getAttachmentPath(attachment);
    if (!fs.existsSync(srcPath)) return null;
    const newId = crypto.randomUUID();
    return copyFileToAttachment(srcPath, newId, attachment.name);
  }

  async function copyAttachments(attachments) {
    const copies = [];
    for (const att of attachments || []) {
      const copy = await copyAttachment(att);
      if (copy) copies.push(copy);
    }
    return copies;
  }

  async function copyAttachmentsForTemplate(attachments) {
    const copies = [];
    for (const att of attachments || []) {
      const srcPath = getAttachmentPath(att);
      if (!fs.existsSync(srcPath)) continue;
      const templateAttId = crypto.randomUUID();
      const dir = path.join(templatesRoot(), templateAttId);
      const { storedName, size } = await copyFileToDir(srcPath, dir, att.name);
      copies.push({
        id: templateAttId,
        name: att.name,
        storedName,
        size,
        addedAt: Date.now(),
        storageKind: 'template',
      });
    }
    return copies;
  }

  async function cloneTemplateAttachments(templateAttachments) {
    const copies = [];
    for (const att of templateAttachments || []) {
      const srcPath = getAttachmentPath(att);
      if (!fs.existsSync(srcPath)) continue;
      const newId = crypto.randomUUID();
      const meta = await copyFileToAttachment(srcPath, newId, att.name);
      copies.push(meta);
    }
    return copies;
  }

  async function removeAttachmentFile(attachment) {
    const dir = resolveAttachmentDir(attachment);
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
    } catch (err) {
      console.error('Failed to remove attachment:', err);
    }
  }

  async function removeAttachments(attachments) {
    for (const att of attachments || []) {
      await removeAttachmentFile(att);
    }
  }

  return {
    pickAndCopyFiles,
    copyAttachment,
    copyAttachments,
    copyAttachmentsForTemplate,
    cloneTemplateAttachments,
    getAttachmentPath,
    removeAttachmentFile,
    removeAttachments,
  };
}

module.exports = { createAttachmentStore };
