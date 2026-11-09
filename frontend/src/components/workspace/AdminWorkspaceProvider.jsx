import { useCallback, useEffect, useRef, useState } from "react";
import { AdminWorkspaceContext } from "./AdminWorkspaceContext";
import { adminWorkspaceRequest } from "../../api/admin-workspace";
import "./admin-find.css";
export default function AdminWorkspaceProvider({
  children,
  currentUser,
  pageKey,
}) {
  const [search, setSearch] = useState({ page: pageKey, text: "" }),
    [matchCount, setMatchCount] = useState(0),
    [notificationState, setNotificationState] = useState(null);
  const scope = useRef(null),
    ranges = useRef([]),
    selected = useRef(-1);
  const token = currentUser?.accessToken,
    query = search.page === pageKey ? search.text : "";
  const setQuery = useCallback(
    (text) => setSearch({ page: pageKey, text: text.slice(0, 150) }),
    [pageKey],
  );
  const loadNotifications = useCallback(async () => {
    try {
      const data = await adminWorkspaceRequest(token, "notifications");
      setNotificationState({ token, data, error: "" });
    } catch (e) {
      setNotificationState((previous) => ({
        token,
        data: previous?.token === token ? previous.data : null,
        error: e.message,
      }));
    }
  }, [token]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await adminWorkspaceRequest(token, "notifications");
        if (active) setNotificationState({ token, data, error: "" });
      } catch (e) {
        if (active)
          setNotificationState((previous) => ({
            token,
            data: previous?.token === token ? previous.data : null,
            error: e.message,
          }));
      }
    };
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener("focus", load);
    window.addEventListener("admin-notifications-changed", load);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("centyzz-pos-events")
        : null;
    if (channel) channel.onmessage = load;
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener("admin-notifications-changed", load);
      channel?.close();
    };
  }, [token]);
  useEffect(() => {
    const root = scope.current?.querySelector("[data-admin-page]");
    if (!root) return;
    let frame;
    const supported = !!(window.CSS?.highlights && window.Highlight);
    const update = () => {
      ranges.current = [];
      selected.current = -1;
      if (supported) {
        CSS.highlights.delete("admin-page-find");
        CSS.highlights.delete("admin-page-current");
      }
      const text = query.trim().toLocaleLowerCase();
      if (text && supported) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (
            !parent ||
            parent.closest(
              "[data-no-page-search],script,style,input,textarea,select,option",
            ) ||
            !parent.getClientRects().length ||
            getComputedStyle(parent).visibility === "hidden"
          )
            continue;
          const source = node.textContent.toLocaleLowerCase();
          let start = 0,
            index;
          while ((index = source.indexOf(text, start)) !== -1) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + text.length);
            ranges.current.push(range);
            start = index + text.length;
          }
        }
        CSS.highlights.set("admin-page-find", new Highlight(...ranges.current));
      }
      setMatchCount(ranges.current.length);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (supported) {
        CSS.highlights.delete("admin-page-find");
        CSS.highlights.delete("admin-page-current");
      }
    };
  }, [query, pageKey]);
  const nextMatch = (direction) => {
    if (!ranges.current.length) return;
    selected.current =
      (selected.current + direction + ranges.current.length) %
      ranges.current.length;
    const range = ranges.current[selected.current];
    CSS.highlights.set("admin-page-current", new Highlight(range));
    range.startContainer.parentElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };
  const notifications =
      notificationState?.token === token ? notificationState.data : null,
    notificationError =
      notificationState?.token === token ? notificationState.error : "";
  const readNotifications = async (keys) => {
    await adminWorkspaceRequest(token, "notifications/read", {
      method: "POST",
      body: { keys },
    });
    const now = new Date().toISOString();
    setNotificationState((previous) =>
      previous?.token === token && previous.data
        ? {
            ...previous,
            data: {
              ...previous.data,
              items: previous.data.items.map((item) =>
                keys.includes(item.key)
                  ? { ...item, readAt: item.readAt || now }
                  : item,
              ),
            },
          }
        : previous,
    );
  };
  return (
    <AdminWorkspaceContext.Provider
      value={{
        query,
        setQuery,
        matchCount,
        nextMatch,
        notifications,
        notificationError,
        loadNotifications,
        readNotifications,
      }}
    >
      <div className="contents" ref={scope}>
        {children}
      </div>
    </AdminWorkspaceContext.Provider>
  );
}
