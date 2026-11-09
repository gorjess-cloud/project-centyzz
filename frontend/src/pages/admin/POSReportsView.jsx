import { useEffect, useState } from "react";
import {
  CalendarDays,
  Download,
  RefreshCw,
  Wallet,
  CreditCard,
  FileText,
  Printer,
  X,
  Link2,
  AlertTriangle,
} from "lucide-react";
import AdminPageHeader from "../../components/workspace/AdminPageHeader";
import AdminAuthorizationDialog from "../../components/AdminAuthorizationDialog";
import { readJsonResponse } from "../../api/client";
import useSalonProfile from "../../hooks/useSalonProfile";
import { usePageFind } from "../../components/workspace/AdminWorkspaceContext";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const shift = (day, n) =>
  new Date(Date.parse(day + "T00:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
const money = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value ?? 0,
  );
const card = "rounded-2xl border border-[#E7DFD4] bg-white p-5 shadow-sm";
const input =
  "rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] px-3 py-2.5 text-sm outline-none focus:border-[#B58D54]";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5E3C] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";
function csvCell(value) {
  let text = String(value ?? "");
  if (!/^-?\d+(?:\.\d+)?$/.test(text) && /^[\s]*[=+\-@\t\r]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
function downloadCsv(name, rows) {
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function reportRequest(token, path, options = {}) {
  if (!token) throw Error("Sign in as an Admin to view reports.");
  const response = await fetch("/api/admin/reports/" + path, {
    method: options.method || "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.pin ? { "x-management-pin": options.pin } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = await readJsonResponse(response);
  if (!response.ok)
    throw Error(
      Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message || "Unable to load the report.",
    );
  return data;
}
export default function POSReportsView({
  currentUser,
  showHeaderActions = true,
}) {
  const [range, setRange] = useState(() => ({
      from: shift(today(), -6),
      to: today(),
    })),
    [draft, setDraft] = useState(() => ({
      from: shift(today(), -6),
      to: today(),
    })),
    [result, setResult] = useState(null),
    [refresh, setRefresh] = useState(0),
    [tab, setTab] = useState("transactions"),
    [filter, setFilter] = useState("ALL"),
    [notice, setNotice] = useState(""),
    [formError, setFormError] = useState(""),
    [opening, setOpening] = useState("0.00"),
    [actual, setActual] = useState(""),
    [authorization, setAuthorization] = useState(null),
    [selectedCloseout, setSelectedCloseout] = useState(null),
    [linkTarget, setLinkTarget] = useState(null),
    [lookups, setLookups] = useState(null),
    [linkForm, setLinkForm] = useState({ item: "", cashier: "" });
  const [findQuery, setFindQuery] = usePageFind();
  const salon = useSalonProfile(),
    token = currentUser?.accessToken,
    min = shift(today(), -29),
    max = today(),
    key = [range.from, range.to, token, refresh].join(":");
  const ready = result?.key === key,
    data = ready ? result.data : null,
    closeouts = ready ? result.closeouts : [],
    error = ready ? result.error : "",
    loading = !ready;
  useEffect(() => {
    let active = true;
    const query = "from=" + range.from + "&to=" + range.to;
    Promise.all([
      reportRequest(token, "pos?" + query),
      reportRequest(token, "closeouts?" + query),
    ])
      .then(([data, closeouts]) => {
        if (active) setResult({ key, data, closeouts, error: "" });
      })
      .catch((e) => {
        if (active)
          setResult({ key, data: null, closeouts: [], error: e.message });
      });
    return () => {
      active = false;
    };
  }, [token, range.from, range.to, key]);
  useEffect(() => {
    if (!linkTarget) return;
    let active = true;
    reportRequest(token, "lookups")
      .then((data) => {
        if (active) setLookups(data);
      })
      .catch((e) => {
        if (active) setFormError(e.message);
      });
    return () => {
      active = false;
    };
  }, [linkTarget, token]);
  useEffect(() => {
    const refresh = () => setRefresh((n) => n + 1);
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("admin-sales-updated", refresh);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("centyzz-pos-events")
        : null;
    if (channel) channel.onmessage = refresh;
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("admin-sales-updated", refresh);
      channel?.close();
    };
  }, []);
  const apply = (value) => {
    setFormError("");
    if (value.from < min || value.to > max || value.from > value.to) {
      setFormError("Choose an ordered range within the latest 30 days.");
      return;
    }
    setRange({ ...value });
    setDraft({ ...value });
    setActual("");
    setOpening("0.00");
    setNotice("");
  };
  const totals = data?.totals,
    day = range.from === range.to,
    closed = data?.closeoutInfo?.isClosed,
    openingValue = closed
      ? data.closeoutInfo.openingCash
      : Number(opening || 0),
    expected = openingValue + (totals?.cashSales ?? 0),
    difference = actual === "" ? null : Number(actual) - expected;
  const rows = (data?.transactions ?? []).filter(
    (row) =>
      filter === "ALL" ||
      (filter === "CASH" && row.cashAmount !== 0) ||
      (filter === "DIGITAL" && row.digitalAmount !== 0) ||
      (filter === "ADJUSTMENTS" && ["VOIDED", "REFUNDED"].includes(row.status)),
  );
  const exportSales = () => {
    if (!data) return;
    downloadCsv("Centyzz_POS_" + range.from + "_to_" + range.to + ".csv", [
      [salon.salonName + " — POS report"],
      ["From", range.from, "To", range.to],
      [
        "Generated (Philippine time)",
        new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
      ],
      ["Gross completed sales", totals.grossSales.toFixed(2)],
      ["Refunds", totals.refunds.toFixed(2)],
      ["Net sales", totals.netSales.toFixed(2)],
      ["Voided (excluded)", totals.voided.toFixed(2)],
      ["Net cash", totals.cashSales.toFixed(2)],
      ["Net digital", totals.digitalSales.toFixed(2)],
      ["Unallocated / payment difference", totals.unallocatedSales.toFixed(2)],
      [],
      [
        "Date",
        "Transaction",
        "Time",
        "Staff / cashier",
        "Service / item",
        "Payment method",
        "Recorded amount (PHP)",
        "Status",
        "Source",
        "References linked",
      ],
      ...data.transactions.map((row) => [
        row.date,
        row.txnId,
        row.time,
        row.cashier,
        row.service,
        row.method,
        row.amount.toFixed(2),
        row.status,
        row.source,
        row.unlinked ? "No" : "Yes",
      ]),
    ]);
    setNotice("Exported all report rows for the selected dates.");
  };
  const exportCloseouts = () => {
    downloadCsv(
      "Centyzz_Closeouts_" + range.from + "_to_" + range.to + ".csv",
      [
        [salon.salonName + " — Saved closeouts"],
        ["From", range.from, "To", range.to],
        ["Only saved closeouts are included."],
        [],
        [
          "Date",
          "Scope",
          "Closed by",
          "Opening cash (PHP)",
          "Net cash sales (PHP)",
          "Net digital sales (PHP)",
          "Net sales (PHP)",
          "Expected cash (PHP)",
          "Actual cash (PHP)",
          "Difference (PHP)",
          "Saved at",
        ],
        ...closeouts.map((row) => [
          row.date,
          row.scope,
          row.cashier,
          row.openingCash.toFixed(2),
          row.cashSales.toFixed(2),
          row.digitalSales.toFixed(2),
          row.totalSales.toFixed(2),
          row.expectedCash.toFixed(2),
          row.actualCash.toFixed(2),
          row.discrepancy.toFixed(2),
          new Date(row.closedAt).toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
        ]),
      ],
    );
    setNotice(
      "Exported " +
        closeouts.length +
        " saved closeouts for the selected dates.",
    );
  };
  const saveCloseout = (e) => {
    e.preventDefault();
    setAuthorization({
      action: "Save the closeout for " + range.from,
      run: async (pin) => {
        await reportRequest(token, "closeout", {
          method: "POST",
          pin,
          body: {
            reportDate: range.from,
            openingCash: opening,
            actualCash: actual,
          },
        });
        setAuthorization(null);
        setNotice(
          "Daily closeout saved. Its counted cash and sales snapshot are retained.",
        );
        setRefresh((n) => n + 1);
        window.dispatchEvent(new Event("admin-notifications-changed"));
      },
    });
  };
  const saveLinks = (e) => {
    e.preventDefault();
    const [kind, id] = linkForm.item.split(":");
    setAuthorization({
      action:
        "Link report row " +
        linkTarget.txnId +
        " to a service/item and Staff account",
      run: async (pin) => {
        await reportRequest(
          token,
          "transactions/" + linkTarget.legacyId + "/links",
          {
            method: "PATCH",
            pin,
            body: {
              serviceId: kind === "service" ? Number(id) : null,
              productId: kind === "product" ? Number(id) : null,
              cashierId: Number(linkForm.cashier),
            },
          },
        );
        setAuthorization(null);
        setLinkTarget(null);
        setRefresh((n) => n + 1);
        setNotice("References saved. The charged amount was preserved.");
      },
    });
  };
  return (
    <div className="space-y-6 pb-10 text-[#2A1E1B]">
      <AdminPageHeader
        title="POS Reports"
        subtitle="Review accurate sales and saved closeouts for the latest 30 days"
        showHeaderActions={showHeaderActions}
      />
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays size={18} className="text-[#8B5E3C]" />
            Report dates
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Today", 0],
              ["Last 7 days", 6],
              ["Last 30 days", 29],
            ].map(([label, n]) => (
              <button
                type="button"
                key={label}
                onClick={() => apply({ from: shift(max, -n), to: max })}
                className={
                  "rounded-lg border px-3 py-2 text-xs font-semibold " +
                  (range.from === shift(max, -n) && range.to === max
                    ? "border-[#8B5E3C] bg-[#F6EEE4] text-[#8B5E3C]"
                    : "border-[#E7DFD4]")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply(draft);
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-semibold">
            From
            <input
              type="date"
              required
              min={min}
              max={draft.to || max}
              value={draft.from}
              onChange={(e) =>
                setDraft((d) => ({ ...d, from: e.target.value }))
              }
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold">
            To
            <input
              type="date"
              required
              min={draft.from || min}
              max={max}
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              className={input}
            />
          </label>
          <button className={button}>Apply dates</button>
          <button
            type="button"
            onClick={() => setRefresh((n) => n + 1)}
            className="rounded-xl border border-[#E7DFD4] p-3"
            aria-label="Refresh reports"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <span className="pb-2 text-xs text-[#8A8174]">
            {range.from} – {range.to} · Philippine time
          </span>
        </form>
      </section>
      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {formError}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}{" "}
          <button
            className="underline"
            onClick={() => setRefresh((n) => n + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {loading ? (
        <div className={card} role="status">
          Loading reports…
        </div>
      ) : (
        data && (
          <>
            {data.warnings.map((text) => (
              <p
                key={text}
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
              >
                <AlertTriangle size={16} className="shrink-0" />
                {text}
              </p>
            ))}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Net sales",
                  value: totals.netSales,
                  hint: data.kpiData.totalSalesGrowth,
                  Icon: Wallet,
                },
                {
                  label: "Net cash",
                  value: totals.cashSales,
                  hint: "Completed cash minus cash refunds",
                  Icon: Wallet,
                },
                {
                  label: "Net digital",
                  value: totals.digitalSales,
                  hint: "Recorded non-cash payments",
                  Icon: CreditCard,
                },
                {
                  label: "Refunds",
                  value: totals.refunds,
                  hint: money(totals.voided) + " voided (excluded)",
                  Icon: FileText,
                },
              ].map(({ label, value, hint, Icon }) => (
                <div key={label} className={card}>
                  <div className="flex justify-between text-xs font-bold uppercase text-[#8A8174]">
                    <span>{label}</span>
                    <Icon size={17} className="text-[#B58D54]" />
                  </div>
                  <p className="mt-5 text-2xl font-bold">{money(value)}</p>
                  <p className="mt-2 text-[11px] text-[#8A8174]">{hint}</p>
                </div>
              ))}
            </div>
            {totals.unallocatedSales !== 0 && (
              <p className="rounded-xl border border-amber-200 p-4 text-sm">
                Unallocated / payment difference:{" "}
                <strong>{money(totals.unallocatedSales)}</strong>
              </p>
            )}
            <section className={card}>
              <div className="mb-5 flex flex-wrap justify-between gap-3">
                <div className="flex gap-1 rounded-xl bg-[#F6F4EF] p-1">
                  {[
                    ["transactions", "Transactions"],
                    ["closeouts", "Closeout Reports"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={
                        "rounded-lg px-4 py-2 text-xs font-bold " +
                        (tab === id
                          ? "bg-[#2A1E1B] text-white"
                          : "text-[#8A8174]")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={button}
                  disabled={
                    tab === "transactions"
                      ? !data.transactions.length
                      : !closeouts.length
                  }
                  onClick={
                    tab === "transactions" ? exportSales : exportCloseouts
                  }
                >
                  <Download size={15} />
                  {tab === "transactions"
                    ? "Export date range CSV"
                    : "Batch export closeouts"}
                </button>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#8A8174]">
                  {tab === "transactions"
                    ? data.transactions.length +
                      " recorded rows · historical charges are retained"
                    : closeouts.length +
                      " saved closeouts · selected dates only"}
                </p>
                <input
                  aria-label="Find text in reports"
                  placeholder="Highlight text on this page…"
                  className={input}
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                />
              </div>
              {tab === "transactions" ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      ["ALL", "All"],
                      ["CASH", "Cash"],
                      ["DIGITAL", "Digital"],
                      ["ADJUSTMENTS", "Voids & refunds"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setFilter(id)}
                        className={
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold " +
                          (filter === id
                            ? "border-[#8B5E3C] bg-[#F6EEE4]"
                            : "border-[#E7DFD4]")
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F5F0] text-[10px] uppercase text-[#8A8174]">
                        <tr>
                          {[
                            "Date / transaction",
                            "Staff / cashier",
                            "Service / item",
                            "Method",
                            "Amount",
                            "Status",
                          ].map((x) => (
                            <th key={x} className="p-3">
                              {x}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7DFD4]">
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <td className="p-3">
                              <strong className="block">{row.txnId}</strong>
                              <span className="text-[10px] text-[#8A8174]">
                                {row.date} · {row.time}
                              </span>
                            </td>
                            <td className="p-3">
                              {row.cashier}
                              {!row.cashierId && (
                                <span className="mt-1 block text-[9px] text-amber-700">
                                  Unlinked historical name
                                </span>
                              )}
                            </td>
                            <td className="max-w-xs p-3">
                              <span>{row.service}</span>
                              {row.source === "legacy" && (
                                <button
                                  className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#8B5E3C]"
                                  onClick={() => {
                                    setLinkTarget(row);
                                    setLinkForm({
                                      item: "",
                                      cashier: String(row.cashierId || ""),
                                    });
                                    setFormError("");
                                  }}
                                >
                                  <Link2 size={12} />
                                  {row.unlinked
                                    ? "Link details"
                                    : "Edit references"}
                                </button>
                              )}
                            </td>
                            <td className="p-3">{row.method}</td>
                            <td className="whitespace-nowrap p-3 font-bold">
                              {money(row.amount)}
                            </td>
                            <td className="p-3">
                              <span
                                className={
                                  "rounded-full px-2 py-1 text-[9px] font-bold " +
                                  (row.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-800")
                                }
                              >
                                {row.status.replaceAll("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!rows.length && (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-10 text-center text-[#8A8174]"
                            >
                              No matching transaction records for these dates.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F5F0] text-[10px] uppercase text-[#8A8174]">
                      <tr>
                        {[
                          "Date",
                          "Scope",
                          "Closed by",
                          "Net sales",
                          "Actual cash",
                          "Difference",
                          "Details",
                        ].map((x) => (
                          <th key={x} className="p-3">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DFD4]">
                      {closeouts.map((row) => (
                        <tr key={row.id}>
                          <td className="p-3 font-bold">{row.date}</td>
                          <td className="p-3">{row.scope}</td>
                          <td className="p-3">{row.cashier}</td>
                          <td className="p-3">{money(row.totalSales)}</td>
                          <td className="p-3">{money(row.actualCash)}</td>
                          <td className="p-3">{money(row.discrepancy)}</td>
                          <td className="p-3">
                            <button
                              className="font-bold text-[#8B5E3C]"
                              onClick={() => setSelectedCloseout(row)}
                            >
                              View saved report
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!closeouts.length && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-10 text-center text-[#8A8174]"
                          >
                            No saved closeouts for these dates. Batch export
                            includes saved records only.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className={card}>
              <h2 className="text-base font-bold">Daily Cash Closeout</h2>
              <p className="mt-1 text-xs text-[#8A8174]">
                A saved closeout keeps the actual cash count and a snapshot of
                that day’s recorded sales.
              </p>
              {!day ? (
                <p className="mt-5 rounded-xl bg-[#F8F5F0] p-4 text-sm">
                  Select a single calendar day to count and close the register.
                </p>
              ) : closed ? (
                <div className="mt-5 space-y-3">
                  <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                    Closeout already saved for {range.from}. Closed by{" "}
                    {data.closeoutInfo.cashier}.
                  </p>
                  <p className="text-sm">
                    Recorded count: {money(data.closeoutInfo.actualCashCount)}
                  </p>
                  {data.closeoutInfo.sourceChanged && (
                    <p
                      role="alert"
                      className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
                    >
                      Sales changed after this closeout. The live totals above
                      and the original saved snapshot may differ; review the
                      saved report.
                    </p>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={saveCloseout}
                  className="mt-5 grid gap-4 sm:grid-cols-3"
                >
                  <label className="flex flex-col gap-2 text-xs font-semibold">
                    Opening cash (PHP)
                    <input
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      required
                      value={opening}
                      onChange={(e) => setOpening(e.target.value)}
                      className={input}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold">
                    Actual counted cash (PHP)
                    <input
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      required
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      className={input}
                    />
                  </label>
                  <div className="rounded-xl bg-[#F8F5F0] p-4 text-xs">
                    <p>
                      Expected cash: <strong>{money(expected)}</strong>
                    </p>
                    <p className="mt-2">
                      Difference:{" "}
                      <strong>
                        {difference === null
                          ? "Enter actual cash"
                          : money(difference)}
                      </strong>
                    </p>
                  </div>
                  <button
                    className={button}
                    disabled={actual === "" || totals.unallocatedSales !== 0}
                  >
                    Save closeout with PIN
                  </button>
                </form>
              )}
            </section>
          </>
        )
      )}
      {selectedCloseout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Saved closeout report"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">Saved Closeout Report</h2>
              <div className="flex gap-2">
                <button
                  className="rounded-xl border p-2"
                  aria-label="Print saved closeout"
                  onClick={() => window.print()}
                >
                  <Printer size={17} />
                </button>
                <button
                  className="rounded-xl border p-2"
                  aria-label="Close saved report"
                  onClick={() => setSelectedCloseout(null)}
                >
                  <X size={17} />
                </button>
              </div>
            </div>
            <div className="admin-report-print">
              <h3 className="text-xl font-bold">{salon.salonName}</h3>
              <p className="text-xs text-[#8A8174]">
                {salon.address} · {salon.phone}
              </p>
              <p className="my-4 font-bold">
                {selectedCloseout.date} · Closed by {selectedCloseout.cashier}
              </p>
              {selectedCloseout.legacy && (
                <p className="mb-4 text-xs text-amber-700">
                  Legacy saved summary: no transaction snapshot was stored with
                  this record.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Opening cash", selectedCloseout.openingCash],
                  ["Net cash sales", selectedCloseout.cashSales],
                  ["Net digital sales", selectedCloseout.digitalSales],
                  ["Net sales", selectedCloseout.totalSales],
                  ["Expected cash", selectedCloseout.expectedCash],
                  ["Actual cash", selectedCloseout.actualCash],
                  ["Difference", selectedCloseout.discrepancy],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#E7DFD4] p-3"
                  >
                    <p className="text-xs text-[#8A8174]">{label}</p>
                    <strong>{money(value)}</strong>
                  </div>
                ))}
              </div>
              {selectedCloseout.snapshot?.transactions && (
                <table className="mt-5 w-full text-left text-xs">
                  <thead>
                    <tr>
                      {[
                        "Transaction",
                        "Cashier",
                        "Service / item",
                        "Amount",
                        "Status",
                      ].map((x) => (
                        <th className="border-b p-2" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCloseout.snapshot.transactions.map((row) => (
                      <tr key={row.id}>
                        <td className="border-b p-2">{row.txnId}</td>
                        <td className="border-b p-2">{row.cashier}</td>
                        <td className="border-b p-2">{row.service}</td>
                        <td className="border-b p-2">{money(row.amount)}</td>
                        <td className="border-b p-2">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <style>
            {
              "@media print{body *{visibility:hidden}.admin-report-print,.admin-report-print *{visibility:visible}.admin-report-print{position:absolute;left:0;top:0;width:100%;padding:20px}}"
            }
          </style>
        </div>
      )}
      {linkTarget && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Link report references"
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"
          >
            <h2 className="text-base font-bold">Link Report References</h2>
            <p className="text-xs text-[#8A8174]">
              {linkTarget.txnId} · {money(linkTarget.amount)}. This changes
              references only; the charged amount stays unchanged.
            </p>
            <form onSubmit={saveLinks} className="space-y-4">
              <label className="flex flex-col gap-2 text-xs font-semibold">
                Service or item
                <select
                  className={input}
                  required
                  value={linkForm.item}
                  onChange={(e) =>
                    setLinkForm((v) => ({ ...v, item: e.target.value }))
                  }
                >
                  <option value="">Choose from the catalog</option>
                  <optgroup label="Services">
                    {lookups?.services.map((s) => (
                      <option key={s.id} value={"service:" + s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Inventory items">
                    {lookups?.products.map((s) => (
                      <option key={s.id} value={"product:" + s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold">
                Staff / cashier
                <select
                  className={input}
                  required
                  value={linkForm.cashier}
                  onChange={(e) =>
                    setLinkForm((v) => ({ ...v, cashier: e.target.value }))
                  }
                >
                  <option value="">Choose a Staff account</option>
                  {lookups?.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-xs"
                  onClick={() => setLinkTarget(null)}
                >
                  Cancel
                </button>
                <button className={button} disabled={!lookups}>
                  Save with PIN
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {authorization && (
        <AdminAuthorizationDialog
          action={authorization.action}
          onClose={() => setAuthorization(null)}
          onConfirm={authorization.run}
        />
      )}
    </div>
  );
}
