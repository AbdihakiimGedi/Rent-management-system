import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi } from '../../api/paymentApi';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const PaymentList = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    date: ''
  });

  // Remove the debounced search that was causing issues
  // const debouncedSearch = useCallback(
  //   (() => {
  //     let timeoutId;
  //     return (searchValue) => {
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(() => {
  //         performSearch(searchValue);
  //       }, 300); // 300ms delay for live search
  //     };
  //   })(),
  //   []
  // );

  useEffect(() => {
    fetchPayments();
  }, []);

  // Live search effect - simplified
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If search is empty, check if we have filters
      if (filters.status || filters.method || filters.date) {
        performSearch('');
      } else {
        fetchPayments();
      }
    } else {
      // Perform live search with current search term
      performSearch(searchTerm);
    }
  }, [searchTerm]);

  // Filter effect - simplified
  useEffect(() => {
    // Always perform search when filters change, with current search term
    performSearch(searchTerm);
  }, [filters.status, filters.method, filters.date]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getMyPayments({});
      const paymentsData = response.data.payments || [];
      setPayments(paymentsData);

      // Store payments data in sessionStorage for PaymentDetail component
      try {
        sessionStorage.setItem('userPayments', JSON.stringify(paymentsData));
      } catch (storageError) {
        // Silent error handling
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      addNotification('Error fetching payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (searchValue) => {
    try {
      setLoading(true);

      // Build search parameters - always include all active filters
      const params = {};

      // Add search parameter if provided
      if (searchValue && searchValue.trim()) {
        params.search = searchValue.trim();
      }

      // Always add filter parameters if they exist
      if (filters.status) params.status = filters.status;
      if (filters.method) params.method = filters.method;
      if (filters.date) params.date = filters.date;

      const response = await paymentApi.getMyPayments(params);
      const paymentsData = response.data.payments || [];
      setPayments(paymentsData);

      // Store payments data in sessionStorage for PaymentDetail component
      try {
        sessionStorage.setItem('userPayments', JSON.stringify(paymentsData));
      } catch (storageError) {
        // Silent error handling
      }
    } catch (error) {
      addNotification('Error searching payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({ status: '', method: '', date: '' });
    // Fetch all payments after clearing
    setTimeout(() => {
      fetchPayments();
    }, 100);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'HELD': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'FAILED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'RELEASED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REFUNDED': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodClasses = {
      'EVC_PLUS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'BANK': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Not specified': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${methodClasses[method] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-blue-800 bg-clip-text text-transparent dark:from-white dark:via-green-200 dark:to-blue-200 mb-3">
            {t('payments.title', 'My Payments')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('payments.subtitle', 'Track and manage your payment history')}
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Enhanced Search Bar */}
            <div className="col-span-full lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('payments.filters.search', 'Search')}
                </span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by ID, mobile number, item name, amount..."
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Search by: Booking ID, Mobile Number, Item Name, Amount, Status, or Method
              </p>
            </div>

            {/* Enhanced Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('payments.filters.status', 'Status')}
                </span>
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400 transition-all duration-200 text-gray-900 dark:text-white"
              >
                <option value="">{t('payments.filters.allStatuses', 'All Statuses')}</option>
                <option value="PENDING">{t('payments.status.pending', 'Pending')}</option>
                <option value="HELD">{t('payments.status.held', 'Held')}</option>
                <option value="COMPLETED">{t('payments.status.completed', 'Completed')}</option>
                <option value="FAILED">{t('payments.status.failed', 'Failed')}</option>
                <option value="RELEASED">{t('payments.status.released', 'Released')}</option>
                <option value="REFUNDED">{t('payments.status.refunded', 'Refunded')}</option>
              </select>
            </div>

            {/* Enhanced Method Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {t('payments.filters.method', 'Method')}
                </span>
              </label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-purple-400/20 dark:focus:border-purple-400 transition-all duration-200 text-gray-900 dark:text-white"
              >
                <option value="">{t('payments.filters.allMethods', 'All Methods')}</option>
                <option value="EVC_PLUS">{t('payments.method.evcPlus', 'EVC Plus')}</option>
                <option value="BANK">{t('payments.method.bank', 'Bank Transfer')}</option>
              </select>
            </div>

            {/* Enhanced Date Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('payments.filters.date', 'Date')}
                </span>
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:ring-orange-400/20 dark:focus:border-orange-400 transition-all duration-200 text-gray-900 dark:text-white"
              />
            </div>

          </div>

          {/* Enhanced Search Results Info */}
          {(searchTerm || filters.status || filters.method || filters.date) && (
            <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">{payments.length}</span> {t('payments.search.results', 'results found')}
                  {searchTerm && (
                    <span> for "<span className="font-semibold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-md">{searchTerm}</span>"</span>
                  )}
                  {filters.status && (
                    <span> with status "<span className="font-semibold text-gray-900 dark:text-white bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">{filters.status}</span>"</span>
                  )}
                  {filters.method && (
                    <span> with method "<span className="font-semibold text-gray-900 dark:text-white bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md">{filters.method}</span>"</span>
                  )}
                  {filters.date && (
                    <span> on date "<span className="font-semibold text-gray-900 dark:text-white bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">{filters.date}</span>"</span>
                  )}
                </div>
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-400 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('payments.search.clear', 'Clear All')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full">
                <svg className="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {searchTerm || filters.status || filters.method || filters.date
                ? t('payments.search.noResults', 'No payments found')
                : t('payments.empty.title', 'No payments found')
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || filters.status || filters.method || filters.date
                ? t('payments.search.noResultsDescription', 'Try adjusting your search criteria or filters')
                : t('payments.empty.description', 'You haven\'t made any payments yet. Start exploring rental items to get started.')
              }
            </p>
            {(searchTerm || filters.status || filters.method || filters.date) ? (
              <Button
                onClick={clearSearch}
                variant="primary"
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                {t('payments.search.clearAndShowAll', 'Clear Search & Show All')}
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/rental')}
                variant="primary"
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                {t('payments.empty.browseItems', 'Browse Rental Items')}
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-full">
              <table className="w-full table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="w-24 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.bookingId', 'Booking ID')}
                    </th>
                    <th className="w-48 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.item', 'Rental Item')}
                    </th>
                    <th className="w-32 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.status', 'Status')}
                    </th>
                    <th className="w-28 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.amount', 'Amount')}
                    </th>
                    <th className="w-28 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.serviceFee', 'Service Fee')}
                    </th>
                    <th className="w-28 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.totalAmount', 'Total Amount')}
                    </th>
                    <th className="w-32 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.paymentMethod', 'Payment Method')}
                    </th>
                    <th className="w-36 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.paymentAccount', 'Payment Account')}
                    </th>
                    <th className="w-40 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.dates', 'Payment Dates')}
                    </th>
                    <th className="w-24 px-3 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      {t('payments.table.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {payments.map((payment, index) => (
                    <tr
                      key={payment.booking_id}
                      className={`hover:bg-gradient-to-r hover:from-green-50/50 hover:to-blue-50/50 dark:hover:from-green-900/20 dark:hover:to-blue-900/20 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/30 dark:bg-gray-700/30' : 'bg-white dark:bg-gray-800'
                        }`}
                    >
                      <td className="w-24 px-3 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-200 truncate">
                          #{payment.booking_id}
                        </span>
                      </td>
                      <td className="w-48 px-3 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {payment.rental_item_name || 'Unknown Item'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="w-32 px-3 py-4">
                        <div className="truncate">
                          {getStatusBadge(payment.payment_status)}
                        </div>
                      </td>
                      <td className="w-28 px-3 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {formatCurrency(payment.payment_amount)}
                        </div>
                      </td>
                      <td className="w-28 px-3 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {formatCurrency(payment.service_fee)}
                        </div>
                      </td>
                      <td className="w-28 px-3 py-4">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400 truncate">
                          {formatCurrency(payment.total_amount)}
                        </div>
                      </td>
                      <td className="w-32 px-3 py-4">
                        <div className="truncate">
                          {getMethodBadge(payment.payment_method)}
                        </div>
                      </td>
                      <td className="w-36 px-3 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {payment.payment_account || 'Not specified'}
                        </div>
                      </td>
                      <td className="w-40 px-3 py-4">
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          <div className="font-medium truncate">Created: {formatDate(payment.created_at)}</div>
                          {payment.payment_held_at && (
                            <div className="font-medium truncate">Held: {formatDate(payment.payment_held_at)}</div>
                          )}
                          {payment.payment_released_at && (
                            <div className="font-medium truncate">Released: {formatDate(payment.payment_released_at)}</div>
                          )}
                        </div>
                      </td>
                      <td className="w-24 px-3 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/payments/${payment.booking_id}`, {
                            state: { paymentData: payment }
                          })}
                          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-xs"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {t('payments.actions.view', 'View')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentList;