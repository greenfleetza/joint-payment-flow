// Top-of-viewport banner shown while offline.
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { installNetworkRecovery, isOnline, onConnectivityChange } from "@/lib/network-recovery";

export function NetworkBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    installNetworkRecovery();
    setOnline(isOnline());
    return onConnectivityChange(setOnline);
  }, []);
  if (online) return null;
  return (
    <div className="fixed left-1/2 top-3 z-[10001] -translate-x-1/2 rounded-full bg-[color:var(--destructive)]/95 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5" /> Offline — changes will sync when you reconnect
      </span>
    </div>
  );
}
