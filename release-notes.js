const RELEASES = {
  '1.0.11': {
    releasedAt: '2026-07-19',
    slides: [
      {
        title: 'Pin & filter sessions',
        description: 'Pin important sessions so they stay at the top, and filter your session list to show all, pinned, or recently used sessions.',
      },
      {
        title: 'What\'s New changelog',
        description: 'Browse previous release highlights from the What\'s New modal with version numbers and release dates, so you can catch up after being away.',
      },
      {
        title: 'Update & polish fixes',
        description: 'What\'s New now appears after restarting into a new version, the update prompt no longer looks like a box within a box, and the queue action is now labeled Move back.',
      },
    ],
  },
  '1.0.10': {
    releasedAt: '2026-07-16',
    slides: [
      {
        title: 'Task details',
        description: 'Double-click any task or choose Edit details from the context menu to open a full detail view. Update the title, estimated time, notes, and attachments in one place.',
      },
      {
        title: 'Notes & link previews',
        description: 'Add context, links, and reference material in task notes. Paste URLs and SupaSlash fetches a preview card so you can jump back to them later.',
      },
      {
        title: 'File attachments',
        description: 'Attach files to tasks from the detail view. Copies are stored in your SupaSlash data folder, so attachments travel with your tasks and backups.',
      },
      {
        title: 'Move, duplicate & templates',
        description: 'Move tasks between sessions, duplicate with notes and attachments, or add to a template — all from the detail view. Tasks with notes show a subtle dot beside the name in your lists.',
      },
    ],
  },
  '1.0.9': {
    releasedAt: '2026-07-12',
    slides: [
      {
        title: 'License & free trial',
        description: 'Activate your license from Settings → License, or start a free trial to explore SupaSlash before you buy. Your trial status is always visible from the settings menu.',
      },
      {
        title: 'Branded update prompts',
        description: 'Updates now appear in a SupaSlash-styled window instead of generic system dialogs. Check for updates anytime from Settings or the app menu.',
      },
      {
        title: 'Bulk task actions',
        description: 'Select multiple tasks in edit mode with Shift-click ranges or Cmd/Ctrl-click. Complete, delete, or move them together from the context menu or drag handles.',
      },
      {
        title: 'Session time badges',
        description: 'Each session now shows a time badge that totals the estimates on its tasks, so you can see planned session length at a glance. Completed tasks display their actual duration in a badge, and those times roll up into your running session total.',
      },
      {
        title: 'Invoice & billing fixes',
        description: 'Invoice exports now combine same-day work into cleaner line items for a simpler one-page PDF. Toggle billable status on past tasks in Session history and earnings recalculate automatically.',
      },
      {
        title: 'In-app alerts',
        description: 'Errors and notices now appear in a styled in-app modal that matches the rest of SupaSlash. No more jarring native browser alerts breaking the experience.',
      },
    ],
  },
};

function compareReleaseVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
    const av = aParts[i] || 0;
    const bv = bParts[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function getReleaseNotes(version) {
  return RELEASES[version]?.slides || null;
}

function getReleaseDate(version) {
  return RELEASES[version]?.releasedAt || null;
}

function getAllReleases() {
  return Object.entries(RELEASES)
    .map(([version, data]) => ({
      version,
      releasedAt: data.releasedAt,
      slides: data.slides,
    }))
    .sort((a, b) => compareReleaseVersions(b.version, a.version));
}

function formatReleaseDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
