import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="flex">
                <Sidebar onCollapseChange={setIsSidebarCollapsed} />
                <main className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;


