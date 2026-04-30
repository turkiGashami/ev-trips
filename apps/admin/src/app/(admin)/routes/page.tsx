"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, X, ExternalLink, ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { adminApi } from "@/lib/api/admin.api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber, formatDate } from "@/lib/format";
import type { AdminRoute } from "@/types/admin.types";

type SortKey = "trip_count" | "last_trip_date" | "avg_distance_km";

export default function RoutesPage() {
  const t = useTranslations("routes");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("trip_count");
  const debounced = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "routes", debounced, sort],
    queryFn: async () => {
      const res = await adminApi.getRoutes({
        search: debounced || undefined,
        sort,
        limit: 200,
      });
      // The API wraps every response via TransformInterceptor:
      //   { success: true, data: <handlerReturn>, message? }
      // Our handler returns { data: AdminRoute[], meta: {...} }, so the actual
      // payload lives at res.data.data. Fall back to res.data for the unwrapped
      // case (e.g. unit tests or future interceptor changes).
      const body = res.data as
        | { success?: boolean; data?: { data: AdminRoute[]; meta: { count: number; limit: number } } }
        | { data: AdminRoute[]; meta: { count: number; limit: number } };
      const payload =
        body && typeof body === "object" && "success" in body && body.data
          ? body.data
          : (body as { data: AdminRoute[]; meta: { count: number; limit: number } });
      return payload as { data: AdminRoute[]; meta: { count: number; limit: number } };
    },
    placeholderData: (prev) => prev,
  });

  const routes = data?.data ?? [];
  const total = data?.meta?.count ?? 0;
  const isAr = locale === "ar";

  const cityName = (ar?: string | null, en?: string | null) =>
    (isAr ? ar : en) || ar || en || "—";

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <AdminTopbar title={t("title")} subtitle={t("subtitle")} />

      <div style={{ padding: "24px 32px" }}>
        {/* Filters bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {/* Search */}
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
              maxWidth: 420,
            }}
          >
            <Search
              className="w-4 h-4"
              style={{
                position: "absolute",
                insetInlineStart: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              style={{
                width: "100%",
                padding: "8px 36px 8px 36px",
                fontSize: 13,
                border: "1px solid var(--line)",
                borderRadius: 2,
                background: "var(--cream)",
                color: "var(--ink)",
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="clear"
                style={{
                  position: "absolute",
                  insetInlineEnd: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-4)",
                  display: "inline-flex",
                  padding: 4,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--ink-3)",
            }}
          >
            <span>{t("sort.label")}:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                border: "1px solid var(--line)",
                borderRadius: 2,
                background: "var(--cream)",
                color: "var(--ink)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="trip_count">{t("sort.trip_count")}</option>
              <option value="last_trip_date">{t("sort.last_trip_date")}</option>
              <option value="avg_distance_km">{t("sort.avg_distance_km")}</option>
            </select>
          </label>

          {/* Count */}
          <div
            style={{
              marginInlineStart: "auto",
              fontSize: 12,
              color: "var(--ink-3)",
            }}
          >
            {t("count", { count: total })}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: 2,
            background: "var(--cream)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    background: "var(--sand)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <Th>{t("columns.route")}</Th>
                  <Th align="end">{t("columns.trips")}</Th>
                  <Th align="end">{t("columns.published")}</Th>
                  <Th align="end">{t("columns.pending")}</Th>
                  <Th align="end">{t("columns.avgBattery")}</Th>
                  <Th align="end">{t("columns.avgDistance")}</Th>
                  <Th>{t("columns.lastTrip")}</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {isLoading && routes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "48px 16px",
                        textAlign: "center",
                        color: "var(--ink-3)",
                        fontSize: 13,
                      }}
                    >
                      {t("loading")}
                    </td>
                  </tr>
                ) : routes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "48px 16px",
                        textAlign: "center",
                        color: "var(--ink-3)",
                        fontSize: 13,
                      }}
                    >
                      {debounced ? t("emptyFiltered") : t("empty")}
                    </td>
                  </tr>
                ) : (
                  routes.map((r) => {
                    const key = `${r.departure_city_id}-${r.destination_city_id}`;
                    // Trips page filters by free-text `search`. Use the
                    // language-appropriate name so ar/en searches land cleanly.
                    const fromName = isAr ? r.from_ar : r.from_en;
                    const toName = isAr ? r.to_ar : r.to_en;
                    const searchValue = [fromName, toName].filter(Boolean).join(" ");
                    const tripsHref = searchValue
                      ? `/trips?search=${encodeURIComponent(searchValue)}`
                      : "/trips";
                    return (
                      <tr
                        key={key}
                        style={{
                          borderBottom: "1px solid var(--line-soft)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background =
                            "var(--sand)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background =
                            "transparent";
                        }}
                      >
                        <Td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontWeight: 500,
                              color: "var(--ink)",
                            }}
                          >
                            <span>{cityName(r.from_ar, r.from_en)}</span>
                            <ArrowLeft
                              className="w-3 h-3 flip-rtl"
                              style={{ color: "var(--ink-4)" }}
                            />
                            <span>{cityName(r.to_ar, r.to_en)}</span>
                          </span>
                        </Td>
                        <Td align="end" mono>
                          {formatNumber(r.trip_count)}
                        </Td>
                        <Td align="end" mono dim>
                          {formatNumber(r.published_count)}
                        </Td>
                        <Td align="end" mono dim>
                          {r.pending_count > 0 ? (
                            <span style={{ color: "#d97706", fontWeight: 500 }}>
                              {formatNumber(r.pending_count)}
                            </span>
                          ) : (
                            formatNumber(r.pending_count)
                          )}
                        </Td>
                        <Td align="end" mono dim>
                          {r.avg_arrival_battery != null
                            ? `${r.avg_arrival_battery}%`
                            : "—"}
                        </Td>
                        <Td align="end" mono dim>
                          {r.avg_distance_km != null
                            ? `${formatNumber(r.avg_distance_km)} ${t("km")}`
                            : "—"}
                        </Td>
                        <Td dim>
                          {r.last_trip_date ? formatDate(r.last_trip_date) : "—"}
                        </Td>
                        <Td>
                          <Link
                            href={tripsHref}
                            title={t("viewTrips")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              fontSize: 12,
                              color: "var(--forest)",
                              textDecoration: "none",
                              border: "1px solid var(--line)",
                              borderRadius: 2,
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Cell helpers ───────────────────────────────────────────────────── */
function Th({
  children,
  align = "start",
}: {
  children?: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 500,
        color: "var(--ink-3)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "start",
  mono = false,
  dim = false,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  mono?: boolean;
  dim?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 12px",
        textAlign: align,
        fontSize: 13,
        color: dim ? "var(--ink-2)" : "var(--ink)",
        fontVariantNumeric: mono ? "tabular-nums" : "normal",
      }}
    >
      {children}
    </td>
  );
}
