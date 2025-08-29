// Currency formatting utility
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        // Fallback formatting
        return `$${parseFloat(amount).toFixed(2)}`;
    }
};

// Date formatting utility
export const formatDate = (date, options = {}) => {
    if (!date) return 'N/A';

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };

    try {
        return new Date(date).toLocaleDateString('en-US', defaultOptions);
    } catch (error) {
        return 'Invalid Date';
    }
};

// Date and time formatting utility
export const formatDateTime = (date, options = {}) => {
    if (!date) return 'N/A';

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };

    try {
        return new Date(date).toLocaleString('en-US', defaultOptions);
    } catch (error) {
        return 'Invalid Date';
    }
};

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
    if (!date) return 'N/A';

    try {
        const now = new Date();
        const targetDate = new Date(date);
        const diffInSeconds = Math.floor((now - targetDate) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    } catch (error) {
        return 'Invalid Date';
    }
};

// Number formatting with abbreviations (e.g., 1.2K, 1.5M)
export const formatNumber = (num, digits = 1) => {
    if (num === null || num === undefined || isNaN(num)) return '0';

    const lookup = [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: 'K' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'B' },
        { value: 1e12, symbol: 'T' }
    ];

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup.slice().reverse().find(item => num >= item.value);

    return item ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol : '0';
};

// Percentage formatting
export const formatPercentage = (value, total, decimals = 1) => {
    if (!total || total === 0) return '0%';

    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
};

// Status badge color mapping
export const getStatusColor = (status) => {
    const statusColors = {
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        'Completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Available': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Rented': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Maintenance': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'HELD': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'PENDING': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'FAILED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};


