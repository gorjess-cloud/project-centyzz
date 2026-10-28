import {useUnsavedChanges} from '../../components/UnsavedChangesProvider';
import { useEffect, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { staffPosRequest, announcePosUpdate } from "../../api/staff-pos";
import AdminAuthorizationDialog from "../../components/AdminAuthorizationDialog";
const money = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    value ?? 0,
  );
const input =
  "mt-2 w-full rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] px-3 py-2.5 text-sm outline-none focus:border-[#C5A059]";
export default function StaffCashierCloseout({
  currentUser,
  onSaved,
}) {
  const [result, setResult] = useState(null),
    [refresh, setRefresh] = useState(0),
    [opening, setOpening] = useState("0.00"),
    [actual, setActual] = useState(""),
    [confirm, setConfirm] = useState(false),
    [notice, setNotice] = useState("");
  const {markDirty,markSaved}=useUnsavedChanges();
  const scope='staff-closeout-'+currentUser?.id;
  const token = currentUser?.accessToken,
    key = token + ":" + refresh,
    ready = result?.key === key,
    data = ready ? result.data : null,
    error = ready ? result.error : "",
    loading = !ready;
  useEffect(() => {
    let active = true;
    staffPosRequest(token, "daily")
      .then((data) => {
        if (active) setResult({ key, data, error: "" });
      })
      .catch((e) => {
        if (active) setResult({ key, data: null, error: e.message });
      });
    return () => {
      active = false;
    };
  }, [token, key]);
  const closed = data?.closeoutInfo.isClosed,
    expected = Number(opening || 0) + (data?.totals.cashSales ?? 0);
  const save = async (pin) => {
    await staffPosRequest(token, "closeout", {
      method: "POST",
      pin,
      body: { openingCash: opening, actualCash: actual },
    });
    setConfirm(false);
    markSaved(scope);
    setNotice(
      "Your cashier closeout is saved. Admin can now review it in Closeout Reports.",
    );
    onSaved?.();
    announcePosUpdate();
    setRefresh((n) => n + 1);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <section
        aria-label="Cashier closeout"
        className="w-full space-y-5 rounded-2xl border border-[#E7DFD4] bg-white p-6 text-[#2A1E1B] shadow-sm"
      >
        <div className="flex justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <Wallet size={20} className="text-[#8B5E3C]" />
              My Cashier Closeout
            </h1>
            <p className="mt-1 text-xs text-[#8A8174]">
              {[currentUser?.firstName, currentUser?.lastName]
                .filter(Boolean)
                .join(" ")}{" "}
              · {data?.from || "Today"} · Your account’s sales only
            </p>
          </div>
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label="Refresh cashier summary"
              className="rounded-xl border p-2"
              onClick={() => setRefresh((n) => n + 1)}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
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
            {error}
          </p>
        )}
        {loading ? (
          <p role="status" className="p-5 text-sm">
            Loading your recorded sales…
          </p>
        ) : (
          data && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Net sales", data.totals.netSales],
                  ["Net cash", data.totals.cashSales],
                  ["Net digital", data.totals.digitalSales],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#E7DFD4] p-4"
                  >
                    <p className="text-[10px] text-[#8A8174]">{label}</p>
                    <strong className="mt-2 block text-lg">
                      {money(value)}
                    </strong>
                  </div>
                ))}
              </div>
              {data.warnings.map((w) => (
                <p
                  key={w}
                  className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900"
                >
                  {w}
                </p>
              ))}
              {closed ? (
                <div className="space-y-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  <strong>Your register is closed for today.</strong>
                  <p>Opening cash: {money(data.closeoutInfo.openingCash)}</p>
                  <p>Expected cash: {money(data.closeoutInfo.expectedCash)}</p>
                  <p>
                    Actual count: {money(data.closeoutInfo.actualCashCount)}
                  </p>
                  <p>Difference: {money(data.closeoutInfo.discrepancy)}</p>
                  {data.closeoutInfo.sourceChanged && (
                    <p className="font-bold text-amber-800">
                      Sales changed after closeout. Ask Admin to review the
                      saved snapshot.
                    </p>
                  )}
                </div>
              ) : (
                <form
                  onChange={()=>markDirty(scope)}
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConfirm(true);
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold">
                      Opening cash (PHP)
                      <input
                        className={input}
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        required
                        value={opening}
                        onChange={(e) => setOpening(e.target.value)}
                      />
                    </label>
                    <label className="text-xs font-semibold">
                      Actual counted cash (PHP)
                      <input
                        className={input}
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        required
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 rounded-xl bg-[#F8F5F0] p-4 text-sm">
                    <span>
                      Expected: <strong>{money(expected)}</strong>
                    </span>
                    <span>
                      Difference:{" "}
                      <strong>
                        {actual === ""
                          ? "Enter counted cash"
                          : money(Number(actual) - expected)}
                      </strong>
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8174]">
                    Count your register before closing. This saves your sales
                    snapshot and stops new checkouts on your account for today.
                  </p>
                  <button
                    className="rounded-xl bg-[#4A3928] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                    disabled={
                      actual === "" || data.totals.unallocatedSales !== 0
                    }
                  >
                    Save my closeout with PIN
                  </button>
                </form>
              )}
              <div className="max-h-64 overflow-auto rounded-xl border border-[#E7DFD4]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F5F0]">
                    <tr>
                      {[
                        "Transaction",
                        "Services / items",
                        "Amount",
                        "Status",
                      ].map((x) => (
                        <th className="p-3" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((row) => (
                      <tr key={row.id} className="border-t border-[#E7DFD4]">
                        <td className="p-3">{row.txnId}</td>
                        <td className="p-3">{row.service}</td>
                        <td className="p-3">{money(row.amount)}</td>
                        <td className="p-3">{row.status}</td>
                      </tr>
                    ))}
                    {!data.transactions.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-[#8A8174]"
                        >
                          No recorded sales on your account today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}
      </section>
      {confirm && (
        <AdminAuthorizationDialog
          title="Cashier Authorization"
          action="Save your daily cashier closeout"
          onClose={() => setConfirm(false)}
          onConfirm={save}
        />
      )}
    </div>
  );
}
