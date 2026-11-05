import { ArrowUpRight, BookOpen, FileCode2, Menu } from "lucide-react";

import lightLogo from "@/assets/light-theme-logo.png";
import darkLogo from "@/assets/dark-theme-logo.png";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigation } from "@/hooks/use-navigation";

import { Button } from "@/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/sheet";

const references = [
  {
    label: "Protobuf guide",
    description: "Understand the wire format.",
    icon: BookOpen,
    href: "https://protobuf.dev/programming-guides/encoding/",
  },
  {
    label: "Base64 reference",
    description: "Read the encoding specification.",
    icon: FileCode2,
    href: "https://www.rfc-editor.org/rfc/rfc4648.html",
  },
];

function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <img
        src={lightLogo}
        alt=""
        className="dark:hidden"
        width="2037"
        height="772"
      />
      <img
        src={darkLogo}
        alt=""
        className="hidden dark:block"
        width="2037"
        height="772"
      />
    </span>
  );
}

export function SiteHeader() {
  const { menuOpen, setMenuOpen, closeMenu } = useNavigation();

  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-4 z-[60] -translate-y-24 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:h-24 lg:px-12">
          <div className="flex min-w-0 items-center gap-7">
            <a
              href="/"
              aria-label="proto64 home"
              className="group flex shrink-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
            >
              <BrandLogo />
            </a>
            <p className="hidden border-l border-border pl-7 text-xs leading-relaxed text-muted-foreground xl:block">
              Protobuf &amp; Base64
              <br />
              Payload workspace
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 lg:gap-4">
            <nav
              aria-label="References"
              className="hidden items-center gap-1 rounded-2xl border border-border bg-muted/50 p-1 shadow-xs md:flex"
            >
              {references.map((reference) => (
                <a
                  key={reference.href}
                  href={reference.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-card hover:text-primary hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none lg:px-3.5 lg:text-[13px]"
                >
                  <reference.icon
                    className="size-4 text-primary"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  {reference.label}
                  <ArrowUpRight
                    className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </nav>
            <ThemeToggle />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    className="size-11 rounded-xl border-border bg-card shadow-xs hover:border-primary/30 hover:bg-accent hover:text-accent-foreground motion-reduce:transition-none md:hidden"
                  />
                }
                aria-label="Open navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="border-b pb-6">
                  <div className="mb-4">
                    <BrandLogo />
                  </div>
                  <SheetTitle className="text-base">Navigation</SheetTitle>
                  <SheetDescription>
                    Protobuf &amp; Base64 references.
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="References" className="px-5 py-7">
                  <p className="mb-3 px-1 text-xs font-medium text-muted-foreground">
                    References
                  </p>
                  <ul className="space-y-2">
                    {references.map((reference) => (
                      <li key={reference.href}>
                        <a
                          href={reference.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeMenu}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-accent text-primary">
                              <reference.icon
                                className="size-[18px]"
                                strokeWidth={1.7}
                                aria-hidden="true"
                              />
                            </span>
                            <span>
                              <span className="block text-sm font-medium">
                                {reference.label}
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                {reference.description}
                              </span>
                            </span>
                          </span>
                          <ArrowUpRight
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Opens in a new tab</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 px-3 text-xs leading-relaxed text-muted-foreground">
                    External references open in a new tab.
                  </p>
                </nav>
                <div className="mt-auto flex items-center justify-between gap-4 border-t p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <span className="text-xs font-medium text-muted-foreground">
                    Appearance
                  </span>
                  <ThemeToggle showLabel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
