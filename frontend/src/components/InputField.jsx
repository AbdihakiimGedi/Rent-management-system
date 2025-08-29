import React, { forwardRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const InputField = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const { t } = useLanguage();

  const baseClasses = 'input';
  const errorClasses = error ? 'input-error' : '';
  const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

  const classes = [
    baseClasses,
    errorClasses,
    iconClasses,
    className
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (!icon) return null;

    const iconElement = (
      <span className="absolute inset-y-0 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        {icon}
      </span>
    );

    if (iconPosition === 'right') {
      return <span className="right-0 pr-3">{iconElement}</span>;
    }

    return <span className="left-0 pl-3">{iconElement}</span>;
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && renderIcon()}

        <input
          ref={ref}
          type={type}
          className={classes}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...props}
        />
      </div>

      {helper && !error && (
        <p className="form-helper">{helper}</p>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;