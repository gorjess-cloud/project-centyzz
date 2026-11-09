import { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  Users,
  Package,
  Database,
  Download,
  RefreshCw,
  Save,
} from "lucide-react";
import AdminPageHeader from "../../components/workspace/AdminPageHeader";
import AdminAuthorizationDialog from "../../components/AdminAuthorizationDialog";
import { adminWorkspaceRequest } from "../../api/admin-workspace";
import { useUnsavedChanges } from "../../components/UnsavedChangesProvider";

const card = "rounded-2xl border border-[#E7DFD4] bg-white p-6 shadow-sm";
const input =
  "mt-2 w-full rounded-xl border border-[#E7DFD4] bg-[#FFFDFA] px-4 py-3 text-sm outline-none focus:border-[#9A7049] disabled:opacity-60";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50";
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const tabs = [
  ["profile", "Salon Profile", Building2],
  ["hours", "Operating Hours", Clock],
  ["staff", "Staff & Roles", Users],
  ["inventory", "POS & Inventory", Package],
  ["database", "Database", Database],
];
export default function SettingsView({
  currentUser,
  onNavigate,
  showHeaderActions = true,
}) {
  const [tab, setTab] = useState("profile"),
    [config, setConfig] = useState(null),
    [draft, setDraft] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState(false),
    [extra, setExtra] = useState(null),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0);
  const { markDirty, markSaved, guardNavigation } = useUnsavedChanges();
  const [dirty, setDirty] = useState(false);
  const scope = "admin-salon-settings";
  const token = currentUser?.accessToken;
  useEffect(() => {
    let active = true;
    adminWorkspaceRequest(token, "settings")
      .then((result) => {
        if (active) {
          setConfig(result);
          setDraft(structuredClone(result));
          setDirty(false);
          markSaved(scope);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, refresh, markSaved]);
  useEffect(() => {
    if (!["staff", "database"].includes(tab)) return;
    let active = true;
    adminWorkspaceRequest(token, tab)
      .then((result) => {
        if (active) setExtra(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [tab, token, refresh]);
  const reload = () => {
    setLoading(true);
    setError("");
    setExtra(null);
    setRefresh((n) => n + 1);
  };
  const selectTab = (next) => {
    if (next === tab) return;
    const navigate = () => {
      if (dirty) {
        setDraft(structuredClone(config));
        setDirty(false);
        markSaved(scope);
      }
      setNotice("");
      setError("");
      setExtra(null);
      setTab(next);
    };
    dirty ? guardNavigation(navigate) : navigate();
  };
  const change = (section, key, value) => {
    setDirty(true);
    markDirty(scope);
    setDraft((old) => ({
      ...old,
      [section]: { ...old[section], [key]: value },
    }));
    setNotice("");
  };
  const save = async (pin) => {
    const result = await adminWorkspaceRequest(token, "settings/" + tab, {
      method: "PATCH",
      pin,
      body: { revision: config.revision, values: draft[tab] },
    });
    setConfig(result);
    setDraft(structuredClone(result));
    setDirty(false);
    markSaved(scope);
    setPending(false);
    setNotice("Changes saved.");
    window.dispatchEvent(new Event("salon-profile-updated"));
  };
  const backup = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile: config.profile,
            hours: config.hours,
            inventory: config.inventory,
            currency: config.currency,
            timezone: config.timezone,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "centyzz-salon-settings-" +
      new Date().toISOString().slice(0, 10) +
      ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const field = (section, key, label, type = "text", required = false) => (
    <label
      key={key}
      className={
        "block text-xs font-bold text-[#82786B] " +
        (["address", "description", "receiptHeader", "receiptFooter"].includes(
          key,
        )
          ? "sm:col-span-2"
          : "")
      }
    >
      {label}
      <input
        className={input}
        type={type}
        required={required}
        maxLength={
          key === "description"
            ? 600
            : key === "address"
              ? 500
              : key === "salonName"
                ? 150
                : key === "phone"
                  ? 40
                  : key === "tin"
                    ? 50
                    : 300
        }
        value={draft[section][key] || ""}
        onChange={(e) => change(section, key, e.target.value)}
      />
    </label>
  );
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-[#2A1E1B]">
      <AdminPageHeader
        title="Settings & Configuration"
        subtitle="Manage salon details, booking hours, and inventory preferences"
        showHeaderActions={showHeaderActions}
      />
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button className="ml-3 underline" onClick={() => reload()}>
            Reload
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {loading ? (
        <div className={card}>Loading salon settings…</div>
      ) : (
        config &&
        draft && (
          <section className={card}>
            <div
              role="tablist"
              aria-label="Salon settings"
              className="mb-8 flex flex-wrap gap-1 rounded-xl border border-[#E7DFD4] bg-[#F8F6F2] p-1.5"
            >
              {tabs.map(([id, label, Icon]) => (
                <button
                  role="tab"
                  aria-selected={tab === id}
                  key={id}
                  onClick={() => selectTab(id)}
                  className={
                    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold " +
                    (tab === id ? "bg-[#2A1E1B] text-white" : "text-[#82786B]")
                  }
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            {["profile", "hours", "inventory"].includes(tab) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPending(true);
                }}
              >
                <h2 className="text-lg font-bold">
                  {tab === "profile"
                    ? "Salon Profile & Branding"
                    : tab === "hours"
                      ? "Operating Hours & Booking"
                      : "POS & Inventory Preferences"}
                </h2>
                <p className="mb-6 mt-1 border-b border-[#E7DFD4] pb-4 text-sm text-[#82786B]">
                  {tab === "profile"
                    ? "Contact details and opening hours appear in the website footer."
                    : tab === "hours"
                      ? "These hours control available online booking times in Philippine time."
                      : "Default alerts for new inventory items. Existing item thresholds stay unchanged."}
                </p>
                {tab === "profile" && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {field("profile", "salonName", "Salon name", "text", true)}
                    {field("profile", "phone", "Contact number", "tel", true)}
                    {field(
                      "profile",
                      "address",
                      "Physical address",
                      "text",
                      true,
                    )}
                    {field("profile", "email", "Business email", "email")}
                    {field("profile", "tin", "TIN number (optional)")}
                    {field("profile", "description", "Footer description")}
                  </div>
                )}
                {tab === "hours" && (
                  <div className="space-y-3">
                    {draft.hours.days.map((day, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-2 items-center gap-3 rounded-xl border border-[#E7DFD4] p-4 sm:grid-cols-[1fr_100px_1fr_1fr]"
                      >
                        <strong className="text-sm">{days[i]}</strong>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={day.closed}
                            onChange={(e) =>
                              change(
                                "hours",
                                "days",
                                draft.hours.days.map((d, j) =>
                                  j === i
                                    ? { ...d, closed: e.target.checked }
                                    : d,
                                ),
                              )
                            }
                          />
                          Closed
                        </label>
                        {["start", "end"].map((key) => (
                          <label key={key} className="text-xs text-[#82786B]">
                            {key === "start" ? "Opens" : "Closes"}
                            <input
                              className={input}
                              aria-label={
                                days[i] +
                                " " +
                                (key === "start" ? "opens" : "closes")
                              }
                              type="time"
                              required
                              disabled={day.closed}
                              value={day[key]}
                              onChange={(e) =>
                                change(
                                  "hours",
                                  "days",
                                  draft.hours.days.map((d, j) =>
                                    j === i
                                      ? { ...d, [key]: e.target.value }
                                      : d,
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    ))}
                    <label className="block pt-4 text-sm font-semibold">
                      Booking time interval
                      <select
                        className={input}
                        value={draft.hours.slotInterval}
                        onChange={(e) =>
                          change(
                            "hours",
                            "slotInterval",
                            Number(e.target.value),
                          )
                        }
                      >
                        {[15, 30, 60].map((n) => (
                          <option key={n} value={n}>
                            {n} minutes
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-[#82786B]">
                      A change that would place an upcoming booking outside
                      operating hours cannot be saved.
                    </p>
                  </div>
                )}
                {tab === "inventory" && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold">
                      Default low-stock threshold
                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        required
                        className={input}
                        value={draft.inventory.lowStockThreshold}
                        onChange={(e) =>
                          change(
                            "inventory",
                            "lowStockThreshold",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.inventory.alertsEnabled}
                        onChange={(e) =>
                          change("inventory", "alertsEnabled", e.target.checked)
                        }
                      />
                      Show low-stock alerts
                    </label>
                    <div className="rounded-xl bg-[#F8F6F2] p-4 text-sm sm:col-span-2">
                      <p>
                        Currency: {config.currency} · Time zone:{" "}
                        {config.timezone}
                      </p>
                      <p className="mt-2 text-xs text-[#82786B]">
                        Financial tax configuration is managed centrally. This
                        page does not change prices or completed transactions.
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-8 flex justify-end">
                  <button type="submit" className={button} disabled={!dirty}>
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            )}
            {tab === "staff" && (
              <>
                <h2 className="text-lg font-bold">Staff & Account Roles</h2>
                <p className="mt-1 text-sm text-[#82786B]">
                  Accounts and job roles come from Users and the staff roster.
                </p>
                <div className="my-5 flex gap-3">
                  <button
                    className={button}
                    onClick={() => onNavigate?.("users")}
                  >
                    Manage Users
                  </button>
                  <button
                    className="rounded-xl border px-4 py-2 text-sm"
                    onClick={() => onNavigate?.("schedule")}
                  >
                    Open Schedule
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F8F6F2] text-xs text-[#82786B]">
                      <tr>
                        {[
                          "Name",
                          "Account role",
                          "Staff job role",
                          "Status",
                        ].map((x) => (
                          <th key={x} className="p-3">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {extra?.map((person) => (
                        <tr
                          key={person.id}
                          className="border-b border-[#E7DFD4]"
                        >
                          <td className="p-3 font-semibold">{person.name}</td>
                          <td className="p-3">{person.role}</td>
                          <td className="p-3">{person.job_title || "—"}</td>
                          <td className="p-3">
                            {person.active ? "Active" : "Inactive"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!extra && <p className="p-4 text-sm">Loading accounts…</p>}
                </div>
              </>
            )}
            {tab === "database" && (
              <>
                <h2 className="text-lg font-bold">Database Overview</h2>
                <p className="mt-1 text-sm text-[#82786B]">
                  Connection status and record counts. Credentials and customer
                  details are never included here.
                </p>
                <div className="my-5 flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
                    onClick={() => reload()}
                  >
                    <RefreshCw size={16} />
                    Refresh status
                  </button>
                  <button className={button} onClick={backup}>
                    <Download size={16} />
                    Download settings backup
                  </button>
                </div>
                <p className="mb-4 text-xs text-[#82786B]">
                  The download contains salon preferences only. Full database
                  backups remain in Neon’s backup controls.
                </p>
                {extra ? (
                  <>
                    <p
                      role="status"
                      className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
                    >
                      Database connected · Checked{" "}
                      {new Date(extra.checkedAt).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {extra.tables.map((t) => (
                        <div
                          className="rounded-xl border border-[#E7DFD4] p-4"
                          key={t.label}
                        >
                          <p className="text-xs text-[#82786B]">{t.label}</p>
                          <p className="mt-2 text-xl font-bold">
                            {t.rows.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>Checking database…</p>
                )}
              </>
            )}
          </section>
        )
      )}
      {pending && (
        <AdminAuthorizationDialog
          action={
            "Save " +
            tabs.find((x) => x[0] === tab)?.[1].toLowerCase() +
            " changes"
          }
          onClose={() => setPending(false)}
          onConfirm={save}
        />
      )}
    </div>
  );
}
