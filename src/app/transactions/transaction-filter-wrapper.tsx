'use client';

import React, { useState } from 'react';
import { TransactionFilter } from '@/components/transaction-filter';
import { TransactionList } from '@/components/transaction-list';
import type { TransactionRow } from '@/services/dashboard';

export function TransactionFilterWrapper({
  transactions,
  banks,
}: {
  transactions: TransactionRow[];
  banks: string[];
}) {
  const [filtered, setFiltered] = useState(transactions);

  return (
    <>
      <TransactionFilter
        transactions={transactions}
        banks={banks}
        onFilterChange={(filtered) => setFiltered(filtered)}
      />
      <div className="mt-6">
        <TransactionList transactions={filtered} itemsPerPage={20} />
      </div>
    </>
  );
}
