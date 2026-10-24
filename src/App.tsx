import { SiteHeader } from "@/components/site-header";

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1440px] px-5 py-12 outline-none sm:px-8 lg:px-12"
      >
        <h1 className="text-sm font-medium">Workspace</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          The protobuf tools are not implemented yet.
        </p>
      </main>
    </div>
  );
}

export default App;
