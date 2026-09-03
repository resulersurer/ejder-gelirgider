'use client';

import { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import type { TransactionRow } from '@/services/dashboard';

export interface FilterState {
  direction: 'all' | 'IN' | 'OUT';
  bank: string;
  searchText: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface TransactionFilterProps {
  transactions: TransactionRow[];
  banks: string[];
  onFilterChange: (filtered: TransactionRow[]) => void;
}

export function TransactionFilter({ transactions, banks, onFilterChange }: TransactionFilterProps) {
  const [filter, setFilter] = useState<FilterState>({
    direction: 'all',
    bank: '',
    searchText: '',
  });

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter.direction !== 'all' && tx.direction !== filter.direction) return false;
      if (filter.bank && tx.bank !== filter.bank) return false;
      if (filter.searchText && !tx.description.toLowerCase().includes(filter.searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [transactions, filter]);

  const handleFilterChange = (newFilter: Partial<FilterState>) => {
    const updated = { ...filter, ...newFilter };
    setFilter(updated);
    onFilterChange(filtered);
  };

  const handleReset = () => {
    setFilter({ direction: 'all', bank: '', searchText: '' });
    onFilterChange(transactions);
  };

  const isFiltered = filter.direction !== 'all' || filter.bank || filter.searchText;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtreler</h3>
        </div>
        {isFiltered && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X size={14} /> Sıfırla
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Yön</label>
          <select
            value={filter.direction}
            onChange={(e) => handleFilterChange({ direction: e.target.value as FilterState['direction'] })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tümü</option>
            <option value="IN">Gelen</option>
            <option value="OUT">Giden</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Banka</label>
          <select
            value={filter.bank}
            onChange={(e) => handleFilterChange({ bank: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Bankalar</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Ara</label>
          <input
            type="text"
            placeholder="Açıklama içinde ara..."
            value={filter.searchText}
            onChange={(e) => handleFilterChange({ searchText: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="text-xs text-gray-600">
        {filtered.length} / {transactions.length} işlem gösteriliyor
      </div>
    </div>
  );
}
