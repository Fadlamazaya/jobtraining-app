import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar";

export default function MainLayout() {
  return (
    <div className="flex bg-gray-100 min-h-screen w-full">
      {/* Sidebar tetap */}
      <Sidebar />

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

