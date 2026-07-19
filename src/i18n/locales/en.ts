export default {
    // Common
    "app.name": "ZNote",
    "common.refresh.success": "Data refreshed",

    // Bottom tab labels
    "tabs.notes": "Notes",
    "tabs.shares": "My Shares",
    "tabs.trash": "Trash",

    // Placeholder text
    "placeholder.me": "Profile coming soon",

    // Notes page
    "note.title": "ZNote",
    "note.searchPlaceholder": "Type at least 3 characters to search",
    "note.notebooks": "Notebooks",
    "note.switchNotebook": "Switch notebook",
    "note.categories": "Note Categories",
    "note.empty": "No content yet",
    "note.emptyContent": "Empty note",
    "note.loading": "Loading...",
    "note.untitled": "Untitled",
    // Search
    "note.search.empty": "No notes found",
    // Note list actions
    "note.list.edit": "Edit",
    "note.list.pin": "Pin",
    "note.list.unpin": "Unpin",
    "note.list.share": "Share Link",
    "note.list.shareImage": "Share as Image",
    "note.list.shareImage.success": "Image generated and shared",
    "note.list.shareImage.failed": "Share failed, please retry",
    "note.list.shareImage.tooLong": "Note is too long to share as image",
    "note.list.shareImage.empty": "Note is empty, cannot share",
    "note.list.move": "Move Note",
    "note.list.trash": "Move to Trash",
    "note.list.cancel": "Cancel",
    "note.list.pin.success": "Pinned",
    "note.list.unpin.success": "Unpinned",
    "note.list.sort.success": "Sorted successfully",
    "note.list.sort.failed": "Sort failed, please retry",
    "note.list.trash.success": "Moved to trash",
    "note.list.feature.comingSoon": "Feature coming soon",
    // Vectorize actions
    "note.list.disable_vectorize": "Disable Vectorize",
    "note.list.enable_vectorize": "Enable Vectorize",
    "note.list.disable_vectorize.success": "Vectorization disabled",
    "note.list.enable_vectorize.success": "Vectorization enabled",
    // Vectorize status
    "note.vectorize.status.pending": "Pending",
    "note.vectorize.status.completed": "Completed",
    "note.vectorize.status.skipped": "Skipped (too long)",
    "note.vectorize.status.failed": "Failed",
    "note.vectorize.allowed": "Vectorization allowed",
    "note.vectorize.disallowed": "Vectorization disallowed",
    // Settings menu
    "note.menu.changePassword": "Change Password",
    "note.menu.about": "About",
    "note.menu.logout": "Log Out",
    // Settings sheet (bottom slide-up)
    "note.settings.cancel": "Cancel",
    "note.settings.logoutConfirm": "Are you sure you want to log out?",
    "note.settings.logoutConfirmOk": "Log Out",
    // Change password page
    "note.password.title": "Change Password",
    "note.password.old": "Old Password",
    "note.password.new": "New Password",
    "note.password.repeat": "Confirm New Password",
    "note.password.placeholder.old": "Enter old password",
    "note.password.placeholder.new": "Enter new password",
    "note.password.placeholder.repeat": "Re-enter new password",
    "note.password.submit": "Confirm Change",
    "note.password.success": "Password changed successfully",
    "note.password.fieldsRequired": "Please fill in all password fields",
    "note.password.notMatch": "The two new passwords do not match",
    "note.password.logoutCountdown": "Password changed, logging out in {seconds} seconds",
    // Category actions
    "note.category.renameText": "Rename",
    "note.category.moveText": "Move category",
    "note.category.deleteText": "Delete category",
    "note.category.addChildText": "Add Subcategory",
    "note.category.cancel": "Cancel",
    "note.category.create.title": "Add Category",
    "note.category.create.placeholder": "Enter category name",
    "note.category.create.success": "Category created",
    "note.category.rename.title": "Rename Category",
    "note.category.rename.placeholder": "Enter new name",
    "note.category.rename.success": "Renamed successfully",
    "note.category.delete.title": "Delete Category",
    "note.category.delete.warning": "\"{title}\" cannot be restored after deletion, notes under it will be moved to trash",
    "note.category.delete.hint": "Type the category name to confirm",
    "note.category.delete.confirmText": "Confirm Delete",
    "note.category.delete.success": "Deleted successfully",
    // Move category modal
    "note.category.move.title": "Move Category",
    "note.category.move.source": "Moving",
    "note.category.move.selectTarget": "Select target category",
    "note.category.move.current": "Current location",
    "note.category.move.toHere": "Move here",
    "note.category.move.topLevel": "Move to top level",
    "note.category.move.success": "Moved successfully",
    // Move note modal (reuses move category modal)
    "note.move.title_note": "Move Note",
    "note.move.success": "Moved successfully",
    // Dialog button
    "note.dialog.confirm": "Confirm",

    // Note detail page
    "note.detail.edit": "Edit",
    "note.detail.preview": "Preview",
    "note.detail.save": "Save",
    "note.detail.titlePlaceholder": "Enter note title",
    "note.detail.editPlaceholder": "Start writing...",
    "note.detail.saveSuccess": "Saved",
    "note.detail.saveFailed": "Save failed, please retry",
    "note.detail.loadFailed": "Failed to load note",

    // Login page
    "login.title": "ZNote",
    "login.subtitle": "Sign in to your note account",
    "login.server": "Server URL",
    "login.serverPlaceholder": "https://www.example.com",
    "login.username": "Username / Email",
    "login.usernamePlaceholder": "Enter username or email",
    "login.password": "Password",
    "login.passwordPlaceholder": "Enter password",
    "login.submit": "Sign In",
    "login.logging": "Signing in...",

    // ========== msg key mappings ==========
    // Backend msg keys are used directly as i18n keys (dot-separated)

    // Login
    "login.success": "Signed in successfully",
    "invalid.password": "Invalid password format, 6-18 chars with letters, digits or special chars",
    "invalid.username": "Invalid username format",
    "invalid.email": "Invalid email format",
    "invalid.username.or.password": "Incorrect username or password",

    // Change password (backend msg)
    "user.old_password.invalid": "Old password is incorrect",
    "user.password.repeat.not_match": "The two new passwords do not match",
    "user.password.update.success": "Password updated successfully",

    // Frontend validation errors
    "invalid.server.url": "Invalid server URL, expected http(s)://domain without trailing slash",
    "invalid.input": "Please fill in all fields",

// Network errors (frontend)
	    "network.timeout": "Request timed out, please check your network",
	    "network.disconnected": "Network failed, please check network or server URL",
	    "network.error": "Network error, please try again later",
	    "session.expired": "Session expired, please log in again",

    // Logout fallback
    success: "Operation successful",

    // Unknown msg fallback
    unknown: "Operation failed, please try again later",

    // ========== Shares ==========
    "shares.title": "My Shares",
    "shares.search_placeholder": "Type at least 2 chars to filter",
    "shares.empty": "No shares yet",
    "shares.no_results": "No matching shares",
    "shares.never_expire": "Never expires",
    "shares.copy_link": "Copy Share Link",
    "shares.delete": "Delete Share",
    "shares.delete_confirm": "Delete this share?",
    "shares.delete.success": "Share deleted",
    "shares.copy.success": "Copied to clipboard",
    "shares.status.active": "Active",
    "shares.status.revoked": "Revoked",
    "shares.status.expired": "Expired",
    "shares.result.url": "URL",
    "shares.result.password": "Password",

    // ========== Create Share Modal ==========
    "share.create.title": "Create Share",
    "share.create.noteTitle": "Note Title",
    "share.create.passwordLabel": "Share Password",
    "share.create.passwordHint": "Set a password to restrict access",
    "share.create.passwordPlaceholder": "Enter password",
    "share.create.expireLabel": "Valid Days",
    "share.create.expireHint": "Set expiration days, leave empty for permanent",
    "share.create.expirePlaceholder": "Enter days (optional, empty for permanent)",
    "share.create.confirm": "Create Share",
    "share.create.creating": "Creating...",
    "share.create.success": "Share created successfully",
    "share.create.failed": "Failed to create share",
    "share.create.link": "Share Link",
    "share.create.passwordResult": "Access Password",
    "share.create.copied": "Copied to clipboard",
    "share.create.done": "Done",

    // ========== Trash ==========
    "trash.title": "Trash",
    "trash.empty": "Trash is empty",
    "trash.empty.button": "Empty",
    "trash.empty.confirm": "Empty the trash? This action cannot be undone",
    "trash.empty.success": "Trash has been emptied",
    "trash.permanent_delete": "Delete Permanently",
    "trash.permanent_delete.confirm": "Permanently delete this note? This cannot be undone",
    "trash.permanent_delete.success": "Permanently deleted",
    "trash.move": "Move Note",

    // ========== About ==========
    "about.title": "About",
    "about.feedback": "Feedback",
    "about.community": "Community",
    "about.checkUpdate": "Check for Updates",
    "about.source": "Source Code",
    "about.updateToast": "You're up to date",
    "about.update.checking": "Checking for updates...",
    "about.update.newVersion": "New version v{version}",
    "about.update.goDownload": "Download",

    // ========== AI Chat ==========
    "note.ai.button": "AI Assistant",
    "ai.chat.title": "Chat with AI",
    "ai.chat.new_thread": "New Chat",
    "ai.chat.select_notebook": "Select Notebook",
    "ai.chat.input_placeholder": "Type a message...",
    "ai.chat.empty": "Select a notebook to start chatting",
    "ai.chat.no_threads": "No conversations yet",
    "ai.chat.delete_thread": "Delete thread",
    "ai.chat.disclaimer": "AI responses are based on your notes content, for reference only",
    "ai.disabled.title": "AI Features Not Enabled",
    "ai.disabled.description": "Please enable AI in the dashboard first",
    "ai.tool.running": "Running...",
    "ai.tool.completed": "Completed",
    "ai.tool.input": "Input",
    "ai.tool.result": "Result",
    "ai.error.network": "Network error, please check your connection",
    "ai.error.stream_failed": "Failed to read response stream",
    "ai.scroll_to_bottom": "Scroll to bottom",
    "ai.scroll_to_top": "Scroll to top",
    "ai.stop": "Stop",
};