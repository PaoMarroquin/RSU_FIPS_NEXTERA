import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-screen min-w-0 flex-col md:ml-[230px]">
        <Topbar onMenuClick={toggleSidebar} />
        <main className="min-w-0 flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}