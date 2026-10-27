import HeaderActions from "../../components/workspace/HeaderActions";
import ConfirmationModal from "../../components/ConfirmationModal";
import { getServiceImage } from "../../utils/serviceImages";
import { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
  Search,
  Filter,
  Plus,
  Tag,
  MoreHorizontal,
  Edit3,
  UserX,
  UserCheck,
  X,
  CheckCircle2,
  Archive,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const formatPromoDate = (date) => {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ServiceManagementView({
  currentUser,
  showHeaderActions = true,
}) {
  // Wrapped in useCallback to fix ESLint dependency warning
  const getAuthToken = useCallback(
    () => currentUser?.accessToken || "",
    [currentUser?.accessToken],
  );

  // Active Promo Banner State
  const [activePromo, setActivePromo] = useState({
    title: "Nail Bar Weekday Special",
    appliesTo: "Classic Gel Manicure",
    discountText: "₱200 off",
    startDate: "2026-08-15",
    endDate: "2026-08-31",
    status: "ACTIVE",
  });

  // Services Data from DB
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState("ACTIVE"); // 'ACTIVE' or 'ARCHIVED'
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pendingServiceAction, setPendingServiceAction] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditPromoOpen, setIsEditPromoOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [toastMessage, setToastMessage] = useState("");

  // Form States
  const [serviceForm, setServiceForm] = useState({
    name: "",
    categoryId: "",
    price: "",
    durationHours: "1",
    durationMins: "0",
    description: "",
  });

  const [promoForm, setPromoForm] = useState({
    title: activePromo.title,
    appliesTo: activePromo.appliesTo,
    discountType: "% Off",
    value: "20",
    startDate: activePromo.startDate,
    endDate: activePromo.endDate,
  });

  const openPromoEditor = () => {
    setPromoForm({
      title: "",
      appliesTo: "",
      discountType: "% Off",
      value: "",
      startDate: "",
      endDate: "",
    });
    setIsEditPromoOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // -------------------------------------------------------------
  // API FETCH: Get Promo & Services from Backend & Neon DB
  // -------------------------------------------------------------
  useEffect(() => {
    const loadPromoFromApi = async () => {
      try {
        const response = await fetch("/api/admin/promos", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setActivePromo(data);
          }
        }
      } catch (err) {
        console.error("Error fetching promo:", err);
      }
    };
    loadPromoFromApi();
  }, [getAuthToken]); // Added getAuthToken here

  useEffect(() => {
    let isMounted = true;

    const loadServicesFromApi = async () => {
      setLoading(true);
      try {
        const isArchivedParam = activeTab === "ARCHIVED";
        const token = getAuthToken();

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [response, categoryResponse] = await Promise.all([
          fetch(`/api/admin/services?archived=${isArchivedParam}`, { headers }),
          fetch("/api/admin/services/categories", { headers }),
        ]);
        if (!response.ok)
          throw new Error(`Unable to load services (HTTP ${response.status}).`);
        if (!categoryResponse.ok)
          throw new Error(
            `Unable to load service categories (HTTP ${categoryResponse.status}).`,
          );
        const [data, categoryData] = await Promise.all([
          response.json(),
          categoryResponse.json(),
        ]);
        if (!Array.isArray(data) || !Array.isArray(categoryData))
          throw new Error("Invalid service catalog response.");
        if (isMounted) {
          setServices(data);
          setCategories(categoryData);
          setLoadError("");
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        if (isMounted) setLoadError(err.message || "Unable to load services.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadServicesFromApi();

    return () => {
      isMounted = false;
    };
  }, [activeTab, currentUser?.accessToken, getAuthToken]); // Added getAuthToken here

  const refreshServices = async () => {
    try {
      const isArchivedParam = activeTab === "ARCHIVED";
      const token = getAuthToken();

      const response = await fetch(
        `/api/admin/services?archived=${isArchivedParam}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setServices(data);
        setLoadError("");
      }
    } catch (err) {
      setLoadError(err.message || "Unable to refresh services.");
      console.error("Refresh error:", err);
    }
  };

  // Filter logic
  const tabFilteredServices = services;

  const filteredServices = tabFilteredServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "ALL" || String(s.categoryId) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedServiceIds(paginatedServices.map((s) => s.id));
    } else {
      setSelectedServiceIds([]);
    }
  };

  const handleSelectService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSavePromoSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promoForm),
      });

      if (response.ok) {
        setActivePromo({
          title: promoForm.title,
          appliesTo: promoForm.appliesTo,
          discountText:
            promoForm.discountType === "% Off"
              ? `${promoForm.value}% off`
              : `₱${promoForm.value} off`,
          startDate: promoForm.startDate,
          endDate: promoForm.endDate,
          status: "ACTIVE",
        });
        setIsEditPromoOpen(false);
        showToast("Successfully updated promotional campaign in database!");
      } else {
        showToast("Failed to save promo");
      }
    } catch (err) {
      console.error("Error saving promo:", err);
    }
  };

  // -------------------------------------------------------------
  // API ACTION: Add or Update Service
  // -------------------------------------------------------------
  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : "/api/admin/services";

      const method = editingService ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceForm),
      });

      if (response.ok) {
        setIsAddServiceOpen(false);
        setEditingService(null);
        setServiceForm({
          name: "",
          categoryId: "",
          price: "",
          durationHours: "1",
          durationMins: "0",
          description: "",
        });
        refreshServices();
        showToast(
          editingService
            ? `Successfully updated service`
            : `Successfully added new service`,
        );
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to save service");
      }
    } catch (err) {
      console.error("Error saving service:", err);
    }
  };

  // -------------------------------------------------------------
  // API ACTION: Toggle Status
  // -------------------------------------------------------------
  const handleToggleStatus = async (targetService) => {
    try {
      const response = await fetch(
        `/api/admin/services/${targetService.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      if (response.ok) {
        setActiveMenuId(null);
        refreshServices();
        showToast(`Updated status for ${targetService.name}`);
      } else {
        showToast("Failed to toggle status");
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  // -------------------------------------------------------------
  // API ACTION: Toggle Archive
  // -------------------------------------------------------------
  const handleToggleArchive = async (targetService) => {
    try {
      const response = await fetch(
        `/api/admin/services/${targetService.id}/archive`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        },
      );

      if (response.ok) {
        setActiveMenuId(null);
        refreshServices();
        showToast(
          targetService.isArchived
            ? `Restored ${targetService.name}`
            : `Archived ${targetService.name}`,
        );
      } else {
        showToast("Failed to archive service");
      }
    } catch (err) {
      console.error("Error toggling archive:", err);
    }
  };

  const requestServiceAction = (service, actionType) => {
    const isRestore = actionType === "archive" && service.isArchived;
    const isDeactivation =
      actionType === "status" && service.status === "ACTIVE";
    const actionLabel =
      actionType === "archive"
        ? isRestore
          ? "Restore"
          : "Archive"
        : isDeactivation
          ? "Set inactive"
          : "Set active";
    const consequence =
      actionType === "archive"
        ? isRestore
          ? "It will be available in the service catalog again."
          : "It will be removed from the public and member service catalogs."
        : isDeactivation
          ? "Clients will no longer be able to book this service."
          : "Clients will be able to book this service again.";
    setActiveMenuId(null);
    setPendingServiceAction({
      title: `${actionLabel} service?`,
      message: `${actionLabel} ${service.name}? ${consequence}`,
      confirmLabel: actionLabel,
      danger: !isRestore && (actionType === "archive" || isDeactivation),
      action: () =>
        actionType === "archive"
          ? handleToggleArchive(service)
          : handleToggleStatus(service),
    });
  };

  const renderCategoryBadge = (category) => {
    const name = category || "Uncategorized";
    const normalized = name.toLowerCase();
    const hair = normalized.startsWith("hair");
    const colors = hair
      ? "bg-[#FDEBB6] text-[#8C6D23] border-[#F3DE9F]"
      : normalized.includes("nail")
        ? "bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC]"
        : normalized.includes("aesthetic") || normalized.includes("lash")
          ? "bg-[#FCE4EC] text-[#C2185B] border-[#F8BBD0]"
          : "bg-[#F1ECE4] text-[#736457] border-[#E5DED3]";
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${colors}`}
      >
        {hair ? (
          <Sparkles className="h-3 w-3 shrink-0" />
        ) : (
          <Tag className="h-3 w-3 shrink-0" />
        )}
        {name}
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 text-[#443523] pb-6">
      {loadError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700"
        >
          {loadError}
        </p>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">
            Service Management
          </h1>
          <p className="text-xs text-[#8A8174]">
            Manage salon treatment catalog, pricing, durations, and active promo
            discounts
          </p>
        </div>

        {showHeaderActions && <HeaderActions />}
      </header>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
        {/* Top Controls & Archive Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">All Services</h2>
              <span className="bg-[#3A342B] text-[#F5F1EA] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {tabFilteredServices.length}
              </span>
            </div>

            {/* Active vs Archived Tabs */}
            <div className="flex items-center bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8] ml-2">
              <button
                onClick={() => {
                  setActiveTab("ACTIVE");
                  setCurrentPage(1);
                  setSelectedServiceIds([]);
                  setActiveMenuId(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ACTIVE"
                    ? "bg-[#3A342B] text-[#F5F1EA] shadow-xs"
                    : "text-[#8A8174] hover:text-[#2A1E1B]"
                }`}
              >
                Active Services
              </button>
              <button
                onClick={() => {
                  setActiveTab("ARCHIVED");
                  setCurrentPage(1);
                  setSelectedServiceIds([]);
                  setActiveMenuId(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ARCHIVED"
                    ? "bg-[#3A342B] text-[#F5F1EA] shadow-xs"
                    : "text-[#8A8174] hover:text-[#2A1E1B]"
                }`}
              >
                Archived Services
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search Here..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="relative">
              <select
                aria-label="Filter services by category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none cursor-pointer focus:border-[#C5A059]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8174] pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  name: "",
                  categoryId: "",
                  price: "",
                  durationHours: "1",
                  durationMins: "0",
                  description: "",
                });
                setIsAddServiceOpen(true);
              }}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#C5A059]/40"
            >
              <Plus className="h-4 w-4 text-[#F5F1EA]" />
              <span>Add New Service</span>
            </button>

            <button
              onClick={openPromoEditor}
              className="flex items-center gap-2 bg-white hover:bg-[#FFFDF8] text-[#8B5E3C] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all border border-[#8B5E3C]/30"
            >
              <Tag className="h-4 w-4 text-[#8B5E3C]" />
              <span>Create promo / discount</span>
            </button>
          </div>
        </div>

        {/* Promo Banner Alert */}
        {activeTab === "ACTIVE" && (
          <div className="bg-[#F7F4EF] border border-[#E8DDCF] rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#EFE4D4] text-[#8B5E3C] rounded-xl border border-[#DFCBB5] shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#2A1E1B]">
                  {activePromo.title}
                </h3>
                <p className="text-[11px] text-[#8A8174] mt-0.5">
                  <span className="font-semibold text-[#443523]">
                    {activePromo.appliesTo}
                  </span>{" "}
                  &bull;{" "}
                  <span className="text-[#8B5E3C] font-bold">
                    {activePromo.discountText}
                  </span>{" "}
                  &bull; {formatPromoDate(activePromo.startDate)} –{" "}
                  {formatPromoDate(activePromo.endDate)}
                </p>
              </div>
            </div>

            <button
              onClick={openPromoEditor}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs self-start sm:self-auto border border-[#C5A059]/30"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Current Promo
            </button>
          </div>
        )}

        {/* Services Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#9A907F]">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  selectedServiceIds.length === paginatedServices.length &&
                  paginatedServices.length > 0
                }
                className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0"
              />
              Select all on this page
            </label>
            <span className="text-[10px] text-[#8A8174]">
              {selectedServiceIds.length} selected
            </span>
          </div>

          {loading ? (
            <p
              role="status"
              className="rounded-2xl border border-[#E9E4D8] bg-white p-8 text-center text-xs text-[#8A8174]"
            >
              Loading services from Neon DB...
            </p>
          ) : paginatedServices.length === 0 ? (
            <p className="rounded-2xl border border-[#E9E4D8] bg-white p-8 text-center text-xs text-[#8A8174]">
              No {activeTab.toLowerCase()} services found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {paginatedServices.map((s, index) => {
                const isSelected = selectedServiceIds.includes(s.id);
                const isBottomRow = index >= paginatedServices.length - 3;
                const duration =
                  s.duration ||
                  (s.durationMinutes
                    ? `${s.durationMinutes} mins`
                    : "Duration not provided");

                return (
                  <div key={s.id} className="relative min-w-0">
                    <article
                      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E9E4D8] bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isSelected ? "ring-2 ring-[#C5A059]" : ""}`}
                    >
                      {/* Fixed aspect ratio class below */}
                      <div className="relative aspect-4/3 overflow-hidden rounded-xl">
                        <img
                          src={getServiceImage(s.name, s.category)}
                          alt={s.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <label
                          className="absolute left-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm"
                          aria-label={`Select ${s.name}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectService(s.id)}
                            className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === s.id ? null : s.id)
                          }
                          aria-label={`Actions for ${s.name}`}
                          aria-expanded={activeMenuId === s.id}
                          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#443523] shadow-sm transition-colors hover:bg-white hover:text-[#8B5E3C]"
                          title="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1.5">
                          {renderCategoryBadge(s.category)}
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold ${
                              s.isArchived
                                ? "border-[#DFD5C0] bg-[#EFECE6] text-[#6E6359]"
                                : s.status === "ACTIVE"
                                  ? "border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]"
                                  : "border-[#FAD2CF] bg-[#FCE8E6] text-[#C5221F]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${s.isArchived ? "bg-[#6E6359]" : s.status === "ACTIVE" ? "bg-[#137333]" : "bg-[#C5221F]"}`}
                            />
                            {s.isArchived ? "ARCHIVED" : s.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col px-1 pt-3">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#2A1E1B]">
                          {s.name}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#8A8174]">
                          {s.description ||
                            "Professional salon care tailored for a premium finishing look."}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E9E4D8] px-1 pt-3">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="truncate text-base font-extrabold text-[#B48B43]">
                            {s.price}
                          </span>
                          <span className="shrink-0 text-[10px] text-[#8A8174]">
                            {duration}
                          </span>
                        </div>
                      </div>
                    </article>

                    {activeMenuId === s.id && (
                      <div
                        className={`absolute right-2 z-40 w-52 rounded-xl border border-[#E9E4D8] bg-white py-1.5 text-left shadow-xl animate-fadeIn ${
                          isBottomRow ? "bottom-12" : "top-12"
                        }`}
                      >
                        {!s.isArchived ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingService(s);
                                setServiceForm({
                                  name: s.name,
                                  categoryId: String(s.categoryId ?? ""),
                                  price: s.price
                                    .replace("₱", "")
                                    .replace(/,/g, ""),
                                  durationHours: String(
                                    Math.floor(
                                      Number(s.durationMinutes || 0) / 60,
                                    ),
                                  ),
                                  durationMins: String(
                                    Number(s.durationMinutes || 0) % 60,
                                  ),
                                  description: s.description,
                                });
                                setActiveMenuId(null);
                                setIsAddServiceOpen(true);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#2A1E1B] hover:bg-[#FFFDF8]"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-[#8A8174]" />
                              Edit Service
                            </button>
                            <button
                              onClick={() => requestServiceAction(s, "status")}
                              className="flex w-full items-center gap-2 border-t border-[#E9E4D8] px-3.5 py-2 text-xs font-medium text-[#2A1E1B] hover:bg-[#FFFDF8]"
                            >
                              {s.status === "ACTIVE" ? (
                                <UserX className="h-3.5 w-3.5 text-red-500" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                              {s.status === "ACTIVE"
                                ? "Set Inactive"
                                : "Set Active"}
                            </button>
                            <button
                              onClick={() => requestServiceAction(s, "archive")}
                              className="flex w-full items-center gap-2 border-t border-[#E9E4D8] px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive Service
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => requestServiceAction(s, "archive")}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Restore Service
                            </button>
                            <button
                              onClick={() => {
                                alert(
                                  `Service Details:\nName: ${s.name}\nCategory: ${s.category}\nPrice: ${s.price}\nDuration: ${s.duration}\nDescription: ${s.description}`,
                                );
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 border-t border-[#E9E4D8] px-3.5 py-2 text-xs font-medium text-[#2A1E1B] hover:bg-[#FFFDF8]"
                            >
                              <Search className="h-3.5 w-3.5 text-[#8A8174]" />
                              View Details
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-1 gap-3">
          <span>
            Showing{" "}
            {paginatedServices.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, filteredServices.length)}{" "}
            of {filteredServices.length} items
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold px-2 text-[#443523]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: ADD / EDIT SERVICE ================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-xl border border-[#E9E4D8]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#2A1E1B]">
                  {editingService ? "Edit Service" : "Add New Service"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddServiceOpen(false)}
                className="text-[#8A8174] hover:text-[#2A1E1B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signature Rebonding"
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Category
                  </label>
                  <select
                    required
                    aria-label="Service category"
                    value={serviceForm.categoryId}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {categories
                      .filter(
                        (category) =>
                          (category.isActive && !category.isArchived) ||
                          (editingService &&
                            String(category.id) === serviceForm.categoryId),
                      )
                      .map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                          {!category.isActive || category.isArchived
                            ? " (unavailable for new services)"
                            : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1,500"
                    value={serviceForm.price}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Duration (Hours)
                  </label>
                  <select
                    value={serviceForm.durationHours}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        durationHours: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="0">0 hrs</option>
                    <option value="1">1 hr</option>
                    <option value="2">2 hrs</option>
                    <option value="3">3 hrs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={serviceForm.durationMins}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        durationMins: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="0">0 mins</option>
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter brief description of the service..."
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingService ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE / EDIT PROMO ================= */}
      {isEditPromoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-xl border border-[#E9E4D8]">
                  <Tag className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#2A1E1B]">
                  Create / Edit Promo
                </h3>
              </div>
              <button
                onClick={() => setIsEditPromoOpen(false)}
                className="text-[#8A8174] hover:text-[#2A1E1B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromoSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                  Promo Title
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                  Applies to Service
                </label>
                <input
                  type="text"
                  required
                  value={promoForm.appliesTo}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, appliesTo: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8]">
                    {["% Off", "₱ Off"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() =>
                          setPromoForm({ ...promoForm, discountType: type })
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          promoForm.discountType === type
                            ? "bg-[#8B5E3C] text-white shadow-xs"
                            : "text-[#8A8174]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Discount Value
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.value}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, value: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={promoForm.startDate}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, startDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={promoForm.endDate}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, endDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditPromoOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Save Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingServiceAction && (
        <ConfirmationModal
          title={pendingServiceAction.title}
          message={pendingServiceAction.message}
          confirmLabel={pendingServiceAction.confirmLabel}
          danger={pendingServiceAction.danger}
          onCancel={() => setPendingServiceAction(null)}
          onConfirm={() => {
            pendingServiceAction.action();
            setPendingServiceAction(null);
          }}
        />
      )}
    </div>
  );
}
