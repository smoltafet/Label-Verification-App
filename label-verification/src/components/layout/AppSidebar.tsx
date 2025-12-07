"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  FileText,
  History,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const { logout, userProfile } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const links = [
    {
      label: "New Submission",
      href: "/dashboard",
      icon: (
        <FileText className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Past Submissions",
      href: "/submissions",
      icon: (
        <History className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <User className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <>
      {/* Fixed Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 h-screen">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          
          {/* Bottom Section - Profile and Logout at the very bottom */}
          <div className="flex flex-col gap-3 mt-auto pb-4">
            {/* Profile avatar */}
            <SidebarLink
              link={{
                label: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "TTB Agent",
                href: "/profile",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-semibold">
                    {userProfile ? userProfile.firstName[0] + userProfile.lastName[0] : "TA"}
                  </div>
                ),
              }}
            />
            
            {/* Logout Button - Now at the absolute bottom */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 w-full text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="text-white h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Logout
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area with left margin to account for fixed sidebar */}
      <motion.div 
        className="flex flex-1 flex-col bg-[#F5F5F5] min-h-screen"
        animate={{
          marginLeft: open ? '280px' : '70px',
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <Image
        src="/Logo.png"
        alt="TTB Logo"
        width={32}
        height={32}
        className="flex-shrink-0"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white whitespace-pre"
      >
        TTB Portal
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <Image
        src="/Logo.png"
        alt="TTB Logo"
        width={32}
        height={32}
        className="flex-shrink-0"
      />
    </Link>
  );
};
