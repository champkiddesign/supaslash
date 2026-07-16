const RELEASE_NOTES = {
  '1.0.10': [
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
  '1.0.9': [
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
};

function getReleaseNotes(version) {
  return RELEASE_NOTES[version] || null;
}
