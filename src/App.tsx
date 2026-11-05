import { SiteHeader } from "@/components/site-header";
import { Workspace } from "@/features/workspace/workspace";

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <Workspace />
    </div>
  );
}

export default App;
