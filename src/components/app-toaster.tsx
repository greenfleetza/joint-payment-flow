// Toaster mount for the whole app — added inside root outlet
import { Toaster } from "sonner";
export function AppToaster() {
  return <Toaster richColors position="top-right" theme="light" />;
}
