import { useNavigate, useLocation } from "react-router-dom";
import { Film, Tv, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Custom Home icon matching the reference design
const HomeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
  </svg>
);

const tabs = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "movies", label: "Movies", icon: Film },
  { id: "series", label: "Series", icon: Tv },
  { id: "profile", label: "Profile", icon: User },
];

const tabToPath: Record<string, string> = {
  home: "/",
  movies: "/movies",
  series: "/series",
  profile: "/profile",
};

const pathToTab: Record<string, string> = {
  "/": "home",
  "/movies": "movies",
  "/series": "series",
  "/profile": "profile",
};

export function BottomNav({ activeTab: activeTabProp, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = activeTabProp ?? pathToTab[location.pathname] ?? "home";

  return (
    <nav className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden bottom-nav">
      {/* Dark pill container */}
      <div className="relative w-full flex items-center gap-1.5 p-2 rounded-full bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              onClick={() => {
                const path = tabToPath[tab.id] || "/";
                navigate(path);
                onTabChange?.(tab.id);
              }}
              className={cn(
                "flex items-center gap-2 rounded-full",
                isActive
                  ? "flex-[2] pl-1 pr-4 py-1"
                  : "flex-1 justify-center p-1"
              )}
              style={
                isActive
                  ? { background: "rgba(255, 255, 255, 0.06)" }
                  : undefined
              }
            >
              {/* Icon circle with spring pop */}
              <motion.div
                layout
                animate={
                  isActive
                    ? { scale: [1, 1.28, 1], transition: { duration: 0.32, ease: "easeOut" } }
                    : { scale: 1 }
                }
                className="flex items-center justify-center w-12 h-12 rounded-full"
                style={{
                  background: isActive ? "#4ade80" : "#2c2c2e",
                  boxShadow: isActive ? "0 0 18px rgba(74, 222, 128, 0.4)" : "none",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    isActive ? "text-black" : "text-[#6b6b6b]"
                  )}
                />
              </motion.div>

              {/* Label — AnimatePresence for smooth slide-in/out */}
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="text-sm font-medium whitespace-nowrap"
                    style={{ color: "#ffffff" }}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
