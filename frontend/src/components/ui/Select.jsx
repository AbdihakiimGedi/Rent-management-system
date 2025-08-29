import React, { forwardRef } from 'react';

const Select = forwardRef(({
    children,
    error,
    disabled = false,
    className = '',
    ...props
}, ref) => {
    const baseClasses = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
    const errorClasses = error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
    const darkClasses = 'dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500';

    const classes = [
        baseClasses,
        errorClasses,
        darkClasses,
        className
    ].filter(Boolean).join(' ');

    return (
        <select
            ref={ref}
            className={classes}
            disabled={disabled}
            {...props}
        >
            {children}
        </select>
    );
});

Select.displayName = 'Select';

export default Select;









