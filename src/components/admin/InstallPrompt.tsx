import { Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-green-500 cursor-default"
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        App Installed
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={promptInstall}
      className="w-full justify-start text-sidebar-foreground hover:text-gold"
    >
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}
