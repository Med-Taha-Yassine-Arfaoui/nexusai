'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ProfessionalSidebar from "./ProfessionalSidebar";
import ProfessionalNavbar from "./ProfessionalNavbar";
import ThemeToggle from "./ThemeToggle";

export default function EnhancedProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUserEmail(email || "");
    setReady(true);
  }, []);

  if (!ready) return null;

  const handleSearch = (query: string) => {
    console.log('Dashboard search:', query);
    // Implement search functionality across all dashboards
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Professional Sidebar */}
      <ProfessionalSidebar />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Professional Navbar */}
        <ProfessionalNavbar 
          userEmail={userEmail} 
          onSearch={handleSearch}
        />

        {/* Main Content */}
        <motion.main
          className="p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
