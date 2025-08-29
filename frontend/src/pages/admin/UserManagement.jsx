import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/Button';
// Simple SVG icons
const MagnifyingGlassIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const NoSymbolIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ShieldExclamationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const BuildingOfficeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const CrownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const UserManagement = () => {
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showUserDetails, setShowUserDetails] = useState(null);

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        email: '',
        address: '',
        birthdate: '',
        username: '',
        password: '',
        role: 'user',
        is_active: true,
        is_restricted: false
    });

    useEffect(() => {
        if (user.role === 'admin') {
            fetchUsers();
        }
    }, [currentPage, roleFilter, statusFilter]);

    // Debounced search effect
    useEffect(() => {
        if (user.role === 'admin') {
            const timeoutId = setTimeout(() => {
                if (searchTerm || roleFilter || statusFilter) {
                    setCurrentPage(1); // Reset to first page when searching
                    fetchUsers();
                }
            }, 500); // 500ms delay

            return () => clearTimeout(timeoutId);
        }
    }, [searchTerm, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            if (searchTerm || roleFilter || statusFilter) {
                setSearching(true);
            } else {
                setLoading(true);
            }

            const response = await adminApi.getUsers({
                page: currentPage,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                search: searchTerm || undefined
            });

            setUsers(response.data.users || []);
            setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
        } catch (error) {
            addNotification('Error fetching users', 'error');
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchUsers();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingUser) {
                const updateData = { ...formData };
                if (!updateData.password) {
                    delete updateData.password;
                }

                await adminApi.updateUser(editingUser.id, updateData);
                addNotification('User updated successfully', 'success');
            } else {
                await adminApi.createUser(formData);
                addNotification('User created successfully', 'success');
            }

            resetForm();
            fetchUsers();
        } catch (error) {
            addNotification('Error saving user', 'error');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await adminApi.deleteUser(userId);
            addNotification('User deleted successfully', 'success');
            fetchUsers();
        } catch (error) {
            addNotification('Error deleting user', 'error');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || '',
            phone_number: user.phone_number || '',
            email: user.email || '',
            address: user.address || '',
            birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
            username: user.username || '',
            password: '',
            role: user.role || 'user',
            is_active: user.is_active !== undefined ? user.is_active : true,
            is_restricted: user.is_restricted !== undefined ? user.is_restricted : false
        });
        setShowForm(true);
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            await adminApi.updateUser(userId, { is_active: !currentStatus });
            addNotification(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`, 'success');
            fetchUsers();
        } catch (error) {
            addNotification('Error updating user status', 'error');
        }
    };

    const handleRestrictionToggle = async (userId, currentRestriction) => {
        try {
            await adminApi.toggleUserRestriction(userId, !currentRestriction);
            addNotification(`User ${currentRestriction ? 'unrestricted' : 'restricted'} successfully`, 'success');
            fetchUsers();
        } catch (error) {
            addNotification('Error updating user restriction', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone_number: '',
            email: '',
            address: '',
            birthdate: '',
            username: '',
            password: '',
            role: 'user',
            is_active: true,
            is_restricted: false
        });
        setEditingUser(null);
        setShowForm(false);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <CrownIcon className="w-5 h-5 text-red-500" />;
            case 'owner':
                return <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />;
            default:
                return <UserIcon className="w-5 h-5 text-green-500" />;
        }
    };

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900/20 dark:text-red-300' },
            owner: { bg: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900/20 dark:text-blue-300' },
            user: { bg: 'bg-green-100 text-green-800', dark: 'bg-green-900/20 dark:text-green-300' }
        };

        const config = roleConfig[role] || roleConfig.user;
        return `px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.dark}`;
    };

    const getStatusBadge = (isActive, isRestricted) => {
        if (isRestricted) {
            return 'px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
        }
        return isActive
            ? 'px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            : 'px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    };

    const getStatusText = (isActive, isRestricted) => {
        if (isRestricted) return 'Restricted';
        return isActive ? 'Active' : 'Inactive';
    };

    if (user.role !== 'admin') {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <UserIcon className="w-6 h-6 text-indigo-600" />
                                <span>User Management</span>
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-base">
                                Manage all system users, roles, permissions, and restrictions
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowForm(true)}
                            variant="primary"
                            className="px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add New User
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search users..."
                                className="w-full pl-8 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                            />
                            {searching ? (
                                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : searchTerm ? (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : null}
                        </div>

                        {/* Role Filter */}
                        <div className="relative">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm appearance-none cursor-pointer pr-8"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>
                                <option value="user">User</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-sm appearance-none cursor-pointer pr-8"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="restricted">Restricted</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSearch}
                                variant="primary"
                                className="px-4 py-2 text-sm font-medium"
                            >
                                Search
                            </Button>
                            <Button
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('');
                                    setStatusFilter('');
                                    setCurrentPage(1);
                                }}
                                variant="secondary"
                                className="px-4 py-2 text-sm font-medium"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search Results Summary */}
                {(searchTerm || roleFilter || statusFilter) && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                    <MagnifyingGlassIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                                        Search Results
                                    </h4>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                        {users.length} user{users.length !== 1 ? 's' : ''} found
                                        {searchTerm && ` for "${searchTerm}"`}
                                        {roleFilter && ` with role "${roleFilter}"`}
                                        {statusFilter && ` with status "${statusFilter}"`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('');
                                    setStatusFilter('');
                                    setCurrentPage(1);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-sm font-medium"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Users List */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        User Information
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Contact Details
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Role & Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <UserIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                                <p className="text-base font-medium">No users found</p>
                                                <p className="text-sm">Try adjusting your search criteria or add a new user.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((userItem) => (
                                        <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                                        {userItem.full_name?.charAt(0) || userItem.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {userItem.full_name || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                                                            <span>@{userItem.username}</span>
                                                            {userItem.is_restricted && (
                                                                <ShieldExclamationIcon className="w-3 h-3 text-orange-500" title="Restricted User" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="text-xs text-gray-900 dark:text-white font-medium">
                                                        {userItem.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {userItem.phone_number || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                                                        {userItem.address || 'No address'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        {getRoleIcon(userItem.role)}
                                                        <span className={getRoleBadge(userItem.role)}>
                                                            {userItem.role}
                                                        </span>
                                                    </div>
                                                    <span className={getStatusBadge(userItem.is_active, userItem.is_restricted)}>
                                                        {getStatusText(userItem.is_active, userItem.is_restricted)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                                                {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'N/A'}
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                                                <div className="flex space-x-1">
                                                    <Button
                                                        onClick={() => setShowUserDetails(userItem)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        <EyeIcon className="w-3 h-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleEdit(userItem)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        <PencilIcon className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleStatusToggle(userItem.id, userItem.is_active)}
                                                        variant={userItem.is_active ? 'danger' : 'primary'}
                                                        size="sm"
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        {userItem.is_active ? (
                                                            <>
                                                                <XCircleIcon className="w-3 h-3 mr-1" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleRestrictionToggle(userItem.id, userItem.is_restricted)}
                                                        variant={userItem.is_restricted ? 'primary' : 'danger'}
                                                        size="sm"
                                                        className="px-2 py-1 text-xs"
                                                    >
                                                        {userItem.is_restricted ? (
                                                            <>
                                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                Unrestrict
                                                            </>
                                                        ) : (
                                                            <>
                                                                <NoSymbolIcon className="w-3 h-3 mr-1" />
                                                                Restrict
                                                            </>
                                                        )}
                                                    </Button>
                                                    {userItem.id !== user.id && (
                                                        <Button
                                                            onClick={() => handleDelete(userItem.id)}
                                                            variant="danger"
                                                            size="sm"
                                                            className="px-2 py-1 text-xs"
                                                        >
                                                            <TrashIcon className="w-3 h-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                Page {currentPage} of {totalPages} • Total {users.length} users
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="secondary"
                                    size="sm"
                                    className="px-3 py-1 text-xs"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="secondary"
                                    size="sm"
                                    className="px-3 py-1 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-4 border w-full max-w-xl shadow-lg rounded-lg bg-white dark:bg-gray-800">
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {editingUser ? 'Edit User' : 'Add New User'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Phone Number *
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone_number}
                                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                required
                                                maxLength={9}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Birthdate *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birthdate}
                                                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {!editingUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!editingUser}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>
                                    )}

                                    {editingUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                New Password (leave blank to keep current)
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Role *
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                                            >
                                                <option value="user">User</option>
                                                <option value="owner">Owner</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={formData.is_active}
                                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                                                    Active Account
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="is_restricted"
                                                    checked={formData.is_restricted}
                                                    onChange={(e) => setFormData({ ...formData, is_restricted: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_restricted" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                                                    Restricted User
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="flex-1 py-2 text-sm font-medium"
                                        >
                                            {editingUser ? 'Update User' : 'Create User'}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={resetForm}
                                            variant="secondary"
                                            className="flex-1 py-2 text-sm font-medium"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Details Modal */}
                {showUserDetails && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-4 border w-full max-w-xl shadow-lg rounded-lg bg-white dark:bg-gray-800">
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        User Details
                                    </h3>
                                    <button
                                        onClick={() => setShowUserDetails(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {showUserDetails.full_name?.charAt(0) || showUserDetails.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {showUserDetails.full_name || 'N/A'}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">@{showUserDetails.username}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {getRoleIcon(showUserDetails.role)}
                                                <span className={getRoleBadge(showUserDetails.role)}>
                                                    {showUserDetails.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Contact Information
                                            </label>
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Email:</span> {showUserDetails.email}
                                                </p>
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Phone:</span> {showUserDetails.phone_number || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Address:</span> {showUserDetails.address || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Account Information
                                            </label>
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Birthdate:</span> {showUserDetails.birthdate ? new Date(showUserDetails.birthdate).toLocaleDateString() : 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Created:</span> {showUserDetails.created_at ? new Date(showUserDetails.created_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-900 dark:text-white">
                                                    <span className="font-medium">Status:</span> {getStatusText(showUserDetails.is_active, showUserDetails.is_restricted)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button
                                            onClick={() => {
                                                setShowUserDetails(null);
                                                handleEdit(showUserDetails);
                                            }}
                                            variant="primary"
                                            className="flex-1 py-2 text-sm font-medium"
                                        >
                                            Edit User
                                        </Button>
                                        <Button
                                            onClick={() => setShowUserDetails(null)}
                                            variant="secondary"
                                            className="flex-1 py-2 text-sm font-medium"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
