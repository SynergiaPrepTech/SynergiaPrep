"use client";

import { useEffect, useState } from "react";
import { 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  Save, 
  Plus,
  AlertCircle,
  Calendar,
  Hash,
  DollarSign,
  Minus,
  RefreshCw,
  Users,
  Infinity
} from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  fixedDiscount: number;
  minOrderAmount: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  validTill: string | null;
};

type SaveStatus = {
  [key: string]: "idle" | "saving" | "saved";
};

export default function CouponAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create form state - using controlled inputs with proper typing
  const [form, setForm] = useState({
    code: "",
    fixedDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    validTill: "",
  });

  // Debug log to see what's happening
  useEffect(() => {
    // console.log("Form state updated:", form);
  }, [form]);

  /* ================= FETCH ================= */
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/coupon");
      const data = await res.json();
      setCoupons(data);
      // Initialize save status
      const initialStatus: SaveStatus = {};
      data.forEach((c: Coupon) => {
        initialStatus[c.id] = "idle";
      });
      setSaveStatus(initialStatus);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.code.trim()) newErrors.code = "Code is required";
    if (!form.fixedDiscount || Number(form.fixedDiscount) <= 0) 
      newErrors.fixedDiscount = "Discount must be greater than 0";
    if (form.minOrderAmount && Number(form.minOrderAmount) < 0)
      newErrors.minOrderAmount = "Minimum amount cannot be negative";
    if (form.usageLimit && Number(form.usageLimit) < 0)
      newErrors.usageLimit = "Usage limit cannot be negative";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= CREATE ================= */
  const createCoupon = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await fetch("/api/superadmin/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fixedDiscount: Number(form.fixedDiscount),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        }),
      });

      setForm({
        code: "",
        fixedDiscount: "",
        minOrderAmount: "",
        usageLimit: "",
        validTill: "",
      });
      setErrors({});
      
      await fetchCoupons();
    } catch (error) {
      console.error("Failed to create coupon:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE ================= */
  const updateCoupon = async (coupon: Coupon) => {
    setSaveStatus(prev => ({ ...prev, [coupon.id]: "saving" }));
    
    try {
      await fetch(`/api/superadmin/coupon/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coupon),
      });
      
      // Update save status to show success
      setSaveStatus(prev => ({ ...prev, [coupon.id]: "saved" }));
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [coupon.id]: "idle" }));
      }, 2000);
      
    } catch (error) {
      console.error("Failed to update coupon:", error);
      setSaveStatus(prev => ({ ...prev, [coupon.id]: "idle" }));
    }
  };

  /* ================= DELETE ================= */
  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) return;

    try {
      await fetch(`/api/superadmin/coupon/${id}`, {
        method: "DELETE",
      });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  };

  /* ================= FORMATTING ================= */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.isActive) return "bg-gray-100 text-gray-800";
    if (coupon.validTill && new Date(coupon.validTill) < new Date()) 
      return "bg-red-100 text-red-800";
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.isActive) return "INACTIVE";
    if (coupon.validTill && new Date(coupon.validTill) < new Date()) 
      return "EXPIRED";
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return "LIMIT REACHED";
    return "ACTIVE";
  };

  const handleUsageLimitChange = (couponId: string, value: string) => {
    const newValue = value === "" ? null : Number(value);
    if (newValue !== null && newValue < 0) return; // Prevent negative values
    
    setCoupons(prev => 
      prev.map(c => 
        c.id === couponId 
          ? { ...c, usageLimit: newValue } 
          : c
      )
    );
  };

  // Improved form change handlers with better state management
  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Special handler for date to prevent conflicts
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // console.log("Date changed to:", value);
    handleFormChange("validTill", value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-20">Coupon Management</h1>
              <p className="text-gray-600 mt-2">Create and manage discount coupons for your store</p>
            </div>
            <button
              onClick={fetchCoupons}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-600">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-green-600">
                {coupons.filter(c => c.isActive).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-blue-600">
                {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {coupons.filter(c => c.validTill && new Date(c.validTill) < new Date()).length}
              </p>
            </div>
          </div>
        </div>

        {/* Create Coupon Card */}
        <div className="bg-white rounded-2xl border shadow-sm mb-8 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Coupon
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    Coupon Code *
                  </div>
                </label>
                <input
                  placeholder="e.g., WBJEE25OFF"
                  value={form.code}
                  onChange={(e) => handleFormChange("code", e.target.value.toUpperCase())}
                  onBlur={(e) => handleFormChange("code", e.target.value.toUpperCase())}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.code ? "border-red-300" : "border-gray-300"
                  } focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.code}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    ₹
                    Discount (Fixed Amount) *
                  </div>
                </label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={form.fixedDiscount}
                  onChange={(e) => handleFormChange("fixedDiscount", e.target.value)}
                  onBlur={(e) => handleFormChange("fixedDiscount", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.fixedDiscount ? "border-red-300" : "border-gray-300"
                  } focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
                  min="1"
                  step="1"
                />
                {errors.fixedDiscount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fixedDiscount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Order Amount
                </label>
                <input
                  type="number"
                  placeholder="0 (no minimum)"
                  value={form.minOrderAmount}
                  onChange={(e) => handleFormChange("minOrderAmount", e.target.value)}
                  onBlur={(e) => handleFormChange("minOrderAmount", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.minOrderAmount ? "border-red-300" : "border-gray-300"
                  } focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Usage Limit
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={form.usageLimit}
                    onChange={(e) => handleFormChange("usageLimit", e.target.value)}
                    onBlur={(e) => handleFormChange("usageLimit", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.usageLimit ? "border-red-300" : "border-gray-300"
                    } focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-10`}
                    min="0"
                    step="1"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {form.usageLimit === "" ? <Infinity className="w-4 h-4" /> : null}
                  </div>
                </div>
                {errors.usageLimit && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.usageLimit}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for unlimited usage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Expiry Date
                  </div>
                </label>
                <input
                  type="date"
                  value={form.validTill}
                  onChange={handleDateChange}
                  onBlur={(e) => handleFormChange("validTill", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={createCoupon}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Coupon
                  </>
                )}
              </button>
              <button
                onClick={() => setForm({
                  code: "",
                  fixedDiscount: "",
                  minOrderAmount: "",
                  usageLimit: "",
                  validTill: "",
                })}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">All Coupons</h2>
            <p className="text-sm text-gray-600 mt-1">
              {coupons.length} coupon{coupons.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {loading && coupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-600">Loading coupons...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Hash className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons yet</h3>
              <p className="text-gray-600">Create your first coupon above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-4 px-6 font-medium text-gray-700">CODE</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">DISCOUNT (₹)</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">MIN ORDER</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">USAGE LIMIT</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">USED</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">STATUS</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">EXPIRES</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg text-gray-900">{c.code}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c)}`}>
                            {getStatusText(c)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={c.fixedDiscount}
                            onChange={(e) =>
                              setCoupons((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, fixedDiscount: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            onBlur={(e) =>
                              setCoupons((prev) =>
                                prev.map((x) =>
                                  x.id === c.id
                                    ? { ...x, fixedDiscount: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            min="1"
                            step="1"
                          />
                          <span className="text-gray-600">₹</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <input
                          type="number"
                          value={c.minOrderAmount}
                          onChange={(e) =>
                            setCoupons((prev) =>
                              prev.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      minOrderAmount: Number(e.target.value),
                                    }
                                  : x
                              )
                            )
                          }
                          onBlur={(e) =>
                            setCoupons((prev) =>
                              prev.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      minOrderAmount: Number(e.target.value),
                                    }
                                  : x
                              )
                            )
                          }
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          min="0"
                          step="1"
                        />
                      </td>

                      <td className="py-4 px-6">
                        <div className="relative">
                          <input
                            type="number"
                            value={c.usageLimit === null ? "" : c.usageLimit}
                            onChange={(e) => handleUsageLimitChange(c.id, e.target.value)}
                            onBlur={(e) => handleUsageLimitChange(c.id, e.target.value)}
                            placeholder="Unlimited"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent pr-8"
                            min="0"
                            step="1"
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                            {c.usageLimit === null ? <Infinity className="w-4 h-4" /> : null}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {c.usageLimit === null ? "Unlimited usage" : "Max uses"}
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-green-500 h-full transition-all duration-300"
                                style={{ 
                                  width: `${c.usageLimit ? Math.min((c.usedCount / c.usageLimit) * 100, 100) : 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {c.usedCount}
                              {c.usageLimit && `/${c.usageLimit}`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {c.usageLimit && c.usageLimit > 0 
                              ? `${Math.round((c.usedCount / c.usageLimit) * 100)}% used`
                              : `${c.usedCount} times used`
                            }
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => {
                            setCoupons((prev) =>
                              prev.map((x) =>
                                x.id === c.id
                                  ? { ...x, isActive: !x.isActive }
                                  : x
                              )
                            );
                          }}
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            c.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                          title={c.isActive ? "Deactivate coupon" : "Activate coupon"}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              c.isActive ? "left-7" : "left-1"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatDate(c.validTill)}</span>
                          </div>
                          {c.validTill && new Date(c.validTill) < new Date() && (
                            <span className="text-xs text-red-600 font-medium">Expired</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCoupon(c)}
                            disabled={saveStatus[c.id] === "saving"}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium min-w-[80px] justify-center ${
                              saveStatus[c.id] === "saved" 
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-black text-white hover:bg-gray-800"
                            }`}
                          >
                            {saveStatus[c.id] === "saving" ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : saveStatus[c.id] === "saved" ? (
                              <>
                                <Check className="w-4 h-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All coupon changes are saved immediately. Use responsibly.</p>
        </div>
      </div>
    </div>
  );
}