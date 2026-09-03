'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { TransactionRow } from '@/services/dashboard';
import { normalizeCurrency } from '@/lib/currency';

interface TransactionListProps {
  transactions: TransactionRow[];
  itemsPerPage?: number;
}

type SortKey = keyof TransactionRow;
type SortOrder = 'asc' | 'desc';

export function TransactionList({ transactions, itemsPerPage = 20 }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return copy;
  }, [transactions, sortKey, sortOrder]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paged = sorted.slice(startIdx, startIdx + itemsPerPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <div className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: normalizeCurrency(currency),
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDirIcon = (direction: 'IN' | 'OUT') => {
    return direction === 'IN' ? (
      <ArrowDownRight size={16} className="text-green-600" />
    ) : (
      <ArrowUpRight size={16} className="text-red-600" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Tarih <SortIcon column="date" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('time')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Saat <SortIcon column="time" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('bank')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Banka <SortIcon column="bank" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Tür <SortIcon column="type" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('counterparty')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Karşı Taraf <SortIcon column="counterparty" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('description')}
                  className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900"
                >
                  Açıklama <SortIcon column="description" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end gap-1 font-semibold text-gray-700 hover:text-gray-900 w-full"
                >
                  Tutar <SortIcon column="amount" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paged.map((tx, idx) => (
              <tr key={`${tx.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{tx.date}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tx.time}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.bank}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tx.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{tx.counterparty}</td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{tx.description}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    {getDirIcon(tx.direction)}
                    <span className={tx.direction === 'IN' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {formatMoney(tx.amount, tx.currency)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paged.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>İşlem bulunamadı</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {startIdx + 1} - {Math.min(startIdx + itemsPerPage, sorted.length)} / {sorted.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Önceki
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
