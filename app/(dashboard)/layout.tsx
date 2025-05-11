"use client";

import { Sidebar, MobileSidebar } from "@/components/dashboard/Sidebar";
import { ToastContainer } from "@/components/ui/ToastNotification";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Définir les valeurs de compteur d'images à un seul endroit
  const messagesCount = 25;
  const messagesLimit = 50;

  return (
    <div className="flex h-screen bg-[#111111]">
      {/* Sidebar - visible uniquement sur desktop */}
      <div className="hidden lg:block">
        <Sidebar messagesCount={messagesCount} messagesLimit={messagesLimit} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-28 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <main>{children}</main>
        </div>
      </div>

      {/* Mobile Navigation - visible uniquement sur mobile */}
      <MobileSidebar messagesCount={messagesCount} messagesLimit={messagesLimit} />

      {/* Toast Notifications */}
      <ToastContainer position="top-right" />
    </div>
  );
}
