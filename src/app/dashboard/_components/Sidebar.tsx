"use client";

import { CircleUser, FileVideo, PanelsTopLeft, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  id: number;
  name: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const Sidebar = () => {
  const menuItem: SidebarItem[] = [
    {
      id: 1,
      name: "Dashboard",
      path: "/dashboard",
      icon: PanelsTopLeft,
    },
    {
      id: 2,
      name: "Create New",
      path: "/dashboard/create-new",
      icon: FileVideo,
    },
    {
      id: 3,
      name: "Upgrade",
      path: "/dashboard/upgrade",
      icon: ShieldPlus,
    },
    {
      id: 4,
      name: "Account",
      path: "/dashboard/account",
      icon: CircleUser,
    },
  ];
  const path = usePathname();
  return (
    <div className="w-64 border-r border-gray-400 transition-all duration-300 ease-in h-full bg-gray-800 text-white p-4">
      <div className="grid gap-3">
        {menuItem.map((item) => (
          <Link href={item.path} key={item.id} className={`${path === item.path ? "bg-purple-600 hover:bg-purple-500 rounded-md": ""}`}>
            <div className="flex items-center gap-3 p-3 hover:bg-purple-500 rounded-md cursor-pointer">
              <item.icon />
              <h2>{item.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
