'use client';

import { useState } from 'react';

interface ForecastCategories {
  commit: number;
  consumption: number;
  bestCase: number;
  services: number;
}

interface RollupResult {
  userId: string;
  userName: string;
  role: string;
  categories: ForecastCategories;
  adjustedCategories: ForecastCategories;
  forecastCount: number;
  children?: RollupResult[];
}

interface RollupTableProps {
  data: RollupResult[];
  totals?: ForecastCategories;
  showHierarchy?: boolean;
  showAdjusted?: boolean;
}

function RollupRow({
  item,
  depth = 0,
  showAdjusted = false,
}: {
  item: RollupResult;
  depth?: number;
  showAdjusted?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const hasChildren = item.children && item.children.length > 0;

  const displayCategories = showAdjusted ? item.adjustedCategories : item.categories;
  const total =
    displayCategories.commit +
    displayCategories.consumption +
    displayCategories.bestCase +
    displayCategories.services;

  return (
    <>
      <tr className="border-b border-factory-border hover:bg-factory-hover transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mr-2 p-0.5 hover:bg-factory-card rounded"
              >
                <svg
                  className={`w-4 h-4 text-factory-text-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!hasChildren && <span className="w-6" />}
            <div>
              <span className="font-medium text-factory-text">{item.userName}</span>
              <span className="ml-2 text-xs text-factory-text-dim capitalize">({item.role})</span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm text-factory-success">
          ${displayCategories.commit.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm text-factory-accent">
          ${displayCategories.consumption.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm text-factory-warning">
          ${displayCategories.bestCase.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm text-purple-400">
          ${displayCategories.services.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm font-bold text-factory-text">
          ${total.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-center text-sm text-factory-text-muted">
          {item.forecastCount}
        </td>
      </tr>
      {isExpanded &&
        hasChildren &&
        item.children!.map((child) => (
          <RollupRow key={child.userId} item={child} depth={depth + 1} showAdjusted={showAdjusted} />
        ))}
    </>
  );
}

export default function RollupTable({
  data,
  totals,
  showHierarchy = true,
  showAdjusted = false,
}: RollupTableProps) {
  const grandTotal = totals || data.reduce(
    (acc, item) => {
      const categories = showAdjusted ? item.adjustedCategories : item.categories;
      return {
        commit: acc.commit + categories.commit,
        consumption: acc.consumption + categories.consumption,
        bestCase: acc.bestCase + categories.bestCase,
        services: acc.services + categories.services,
      };
    },
    { commit: 0, consumption: 0, bestCase: 0, services: 0 }
  );

  const total =
    grandTotal.commit + grandTotal.consumption + grandTotal.bestCase + grandTotal.services;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-factory-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              <span className="text-factory-success">Commit</span>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              <span className="text-factory-accent">Consumption</span>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              <span className="text-factory-warning">Best Case</span>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              <span className="text-purple-400">Services</span>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-factory-text-muted uppercase tracking-wider">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <RollupRow key={item.userId} item={item} showAdjusted={showAdjusted} />
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-factory-hover border-t-2 border-factory-border">
            <td className="px-4 py-3 font-bold text-factory-text">Total</td>
            <td className="px-4 py-3 text-right font-mono font-bold text-factory-success">
              ${grandTotal.commit.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono font-bold text-factory-accent">
              ${grandTotal.consumption.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono font-bold text-factory-warning">
              ${grandTotal.bestCase.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono font-bold text-purple-400">
              ${grandTotal.services.toLocaleString()}
            </td>
            <td className="px-4 py-3 text-right font-mono font-bold text-factory-text">
              ${total.toLocaleString()}
            </td>
            <td className="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
