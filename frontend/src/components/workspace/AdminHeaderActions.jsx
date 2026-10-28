import { useContext, useEffect, useId, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { AdminWorkspaceContext } from "./AdminWorkspaceContext";
import {
  useWorkspaceTheme,
  WorkspaceNavigationContext,
} from "./WorkspaceContext";
export default function AdminHeaderActions({ className = "" }) {
  const { theme, toggleTheme } = useWorkspaceTheme(),
    { navigate } = useContext(WorkspaceNavigationContext),
    workspace = useContext(AdminWorkspaceContext);
  const [panel, setPanel] = useState(null),
    [actionError, setActionError] = useState(""),
    [showAll, setShowAll] = useState(false),
    [saving, setSaving] = useState(false);
  const root = useRef(null),
    input = useRef(null),
    searchButton = useRef(null),
    bellButton = useRef(null),
    id = useId();
  const items = workspace.notifications?.items ?? [],
    unread = items.filter((item) => !item.readAt),
    visible = showAll ? items : unread;
  useEffect(() => {
    if (!panel) return;
    if (panel === "search") input.current?.focus();
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setPanel(null);
    };
    const escape = (e) => {
      if (e.key === "Escape") {
        setPanel(null);
        (panel === "search" ? searchButton : bellButton).current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [panel]);
  const markRead = async (keys) => {
    setSaving(true);
    setActionError("");
    try {
      await workspace.readNotifications(keys);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const open = async (item) => {
    if (!item.readAt) await markRead([item.key]);
    setPanel(null);
    navigate(item.page);
  };
  return (
    <div
      className={"workspace-actions " + className}
      ref={root}
      data-no-page-search
    >
      <button
        type="button"
        className="workspace-action"
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        type="button"
        className="workspace-action"
        ref={searchButton}
        aria-label="Find text on this page"
        aria-expanded={panel === "search"}
        aria-controls={panel === "search" ? id : undefined}
        onClick={() => setPanel((p) => (p === "search" ? null : "search"))}
      >
        <Search size={16} />
      </button>
      <button
        type="button"
        className="workspace-action relative"
        ref={bellButton}
        aria-label={
          "Notifications" +
          (unread.length ? ", " + unread.length + " unread" : "")
        }
        aria-expanded={panel === "notifications"}
        aria-controls={panel === "notifications" ? id : undefined}
        onClick={() =>
          setPanel((p) => (p === "notifications" ? null : "notifications"))
        }
      >
        <Bell size={16} />
        {unread.length > 0 && (
          <span className="admin-notification-dot">
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>
      {panel && (
        <section
          className="workspace-action-panel"
          id={id}
          aria-label={
            panel === "search"
              ? "Find text on this page"
              : "Admin notifications"
          }
        >
          <div className="workspace-panel-heading">
            <strong>
              {panel === "search" ? "Find on this page" : "Notifications"}
            </strong>
            <button
              type="button"
              className="workspace-panel-close"
              aria-label="Close panel"
              onClick={() => setPanel(null)}
            >
              <X size={15} />
            </button>
          </div>
          {panel === "search" ? (
            <>
              <label className="workspace-quick-search">
                <Search size={16} />
                <input
                  ref={input}
                  aria-label="Find text on this page"
                  placeholder="Type a word to highlight…"
                  value={workspace.query}
                  onChange={(e) => workspace.setQuery(e.target.value)}
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs">
                <span role="status">
                  {workspace.query.trim()
                    ? workspace.matchCount + " matches on this page"
                    : "Search highlights visible page text."}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg border p-1.5 disabled:opacity-40"
                    aria-label="Previous text match"
                    disabled={!workspace.matchCount}
                    onClick={() => workspace.nextMatch(-1)}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border p-1.5 disabled:opacity-40"
                    aria-label="Next text match"
                    disabled={!workspace.matchCount}
                    onClick={() => workspace.nextMatch(1)}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-2"
                    onClick={() => workspace.setQuery("")}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="mt-3 px-1 text-[10px] text-[#8A8174]">
                Rows stay visible. Change table pages to highlight text on
                another page.
              </p>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? "Show unread" : "Show all active alerts"}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 disabled:opacity-40"
                  disabled={!unread.length || saving}
                  onClick={() => markRead(unread.map((item) => item.key))}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>
              {(workspace.notificationError || actionError) && (
                <p role="alert" className="mb-3 text-xs text-red-700">
                  {workspace.notificationError || actionError}{" "}
                  <button
                    className="underline"
                    onClick={workspace.loadNotifications}
                  >
                    Retry
                  </button>
                </p>
              )}
              {!workspace.notifications && !workspace.notificationError ? (
                <p className="workspace-no-notifications">
                  Loading notifications…
                </p>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {visible.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      disabled={saving}
                      onClick={() => open(item)}
                      className={
                        "block w-full rounded-xl border p-3 text-left " +
                        (item.readAt
                          ? "border-[#E7DFD4]"
                          : "border-[#E7D3B7] bg-[#FFFCF6]")
                      }
                    >
                      <strong className="block text-xs">{item.title}</strong>
                      <span className="mt-1 block text-[11px] leading-relaxed text-[#8A8174]">
                        {item.message}
                      </span>
                      <span className="mt-2 block text-[10px] font-semibold text-[#8B5E3C]">
                        Open{" "}
                        {item.page === "reports"
                          ? "Reports"
                          : item.page === "inventory"
                            ? "Inventory"
                            : "Schedule"}
                      </span>
                    </button>
                  ))}
                  {!visible.length && !workspace.notificationError && (
                    <p className="workspace-no-notifications">
                      {showAll
                        ? "No active alerts right now."
                        : "You’re all caught up."}
                    </p>
                  )}
                </div>
              )}
              <p className="mt-3 text-[10px] text-[#8A8174]">
                {workspace.notifications
                  ? "Updated " +
                    new Date(
                      workspace.notifications.updatedAt,
                    ).toLocaleTimeString("en-PH", {
                      timeZone: "Asia/Manila",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
