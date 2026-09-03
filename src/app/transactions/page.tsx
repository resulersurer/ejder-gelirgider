import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireSession } from '@/lib/auth-guard';
import { getDashboardData, type TransactionRow } from '@/services/dashboard';
import { TransactionFilterWrapper } from './transaction-filter-wrapper';

export const metadata: Metadata = {
  title: 'İşlemler - Banka Dashboard',
  description: 'Tüm banka işlemlerini görüntüleyin ve filtreleyin',
};

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  await requireSession();
  const data = await getDashboardData();

  const banks = [...new Set(data.transactions.map((t) => t.bank))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-white transition-colors"
              title="Geri Dön"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">İşlemler</h1>
              <p className="text-sm text-gray-600 mt-1">Tüm banka işlemlerini bir göz atışta görüntüleyin</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Toplam İşlem</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{data.transactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Gelen İşlem</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {data.transactions.filter((t) => t.direction === 'IN').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Giden İşlem</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {data.transactions.filter((t) => t.direction === 'OUT').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Banka Sayısı</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{banks.length}</p>
          </div>
        </div>

        {/* Filter and List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <TransactionFilterWrapper transactions={data.transactions} banks={banks} />
        </div>
      </div>
    </div>
  );
}
