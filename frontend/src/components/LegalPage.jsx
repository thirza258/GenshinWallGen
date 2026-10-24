import { useState, useEffect } from "react";

const LegalPage = ({
  initialTab = "privacy",
  onNavigateHome,
  onOpenGenerator,
  onOpenPixelStudio,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FDE7CE] text-[#151D4D] font-body flex flex-col selection:bg-[#151D4D] selection:text-[#FFFCF3]">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-30 flex flex-wrap gap-3 justify-between items-center px-4 sm:px-9 py-4 border-b border-black/15 bg-[#FFFCF3]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            id="legal-back-home-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151D4D]/10 hover:bg-[#151D4D] text-[#151D4D] hover:text-[#FFFCF3] text-xs font-semibold transition-all"
            title="Return to Home"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span>Home</span>
          </button>
          <div
            className="font-mono text-base sm:text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onNavigateHome}
          >
            GenshinWall<span className="text-[#C58B35]">Craft</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenPixelStudio}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[#151D4D]/20 text-[#151D4D] text-xs font-semibold hover:bg-[#151D4D]/10 transition-all"
          >
            ▦ Pixel Studio
          </button>
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#151D4D] text-[#FFFCF3] text-xs font-semibold hover:bg-[#0A102E] transition-all shadow-sm"
          >
            <span>Launch Generator</span>
            <span>→</span>
          </button>
        </div>
      </header>

      {/* ─── HERO BANNER ─── */}
      <section className="bg-[#FFFCF3] border-b border-black/10 py-12 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151D4D]/5 border border-black/10 text-xs font-mono font-semibold text-[#C58B35]">
            <span>✦</span>
            <span>Legal & Trust Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
            {activeTab === "privacy" ? "Privacy Policy" : "Terms of Service"}
          </h1>
          <p className="text-sm sm:text-base text-[#151D4D]/70 max-w-2xl">
            {activeTab === "privacy"
              ? "Learn how GenshinWallCraft protects your information. We prioritize your privacy: no HoYoverse passwords, no UID requirements, and full offline-first capability."
              : "The rules and fair-use guidelines governing your use of GenshinWallCraft and its creative productivity tools."}
          </p>

          {/* Navigation Switcher Tabs */}
          <div className="pt-4 flex gap-3 border-t border-black/10">
            <button
              onClick={() => switchTab("privacy")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "privacy"
                  ? "bg-[#151D4D] text-[#FFFCF3] shadow-sm"
                  : "bg-black/5 text-[#151D4D]/80 hover:bg-black/10"
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => switchTab("terms")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "terms"
                  ? "bg-[#151D4D] text-[#FFFCF3] shadow-sm"
                  : "bg-black/5 text-[#151D4D]/80 hover:bg-black/10"
              }`}
            >
              Terms of Service
            </button>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT SECTION ─── */}
      <main className="flex-1 max-w-4xl mx-auto px-5 sm:px-8 py-12 w-full">
        <div className="bg-[#FFFCF3] border border-black/15 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 leading-relaxed">
          <div className="text-xs text-[#151D4D]/50 font-mono pb-4 border-b border-black/10">
            Effective Date: September 18, 2026 · Version 1.2
          </div>

          {activeTab === "privacy" ? (
            /* ─── PRIVACY POLICY CONTENT ─── */
            <div className="space-y-8 text-sm sm:text-base text-[#151D4D]/85">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  1. Overview & Commitment to Player Privacy
                </h2>
                <p>
                  Welcome to <strong>GenshinWallCraft</strong> (
                  <span className="font-mono text-xs text-[#C58B35]">
                    genshinwallpaper.nevatal.id
                  </span>
                  ). We provide a free, fan-made wallpaper generator and pixel art
                  studio to help Travelers track daily commissions, resin reminders,
                  trounce bosses, and farming goals.
                </p>
                <div className="bg-[#FDE7CE]/40 border-l-4 border-[#C58B35] p-4 rounded-r-lg text-xs sm:text-sm text-[#151D4D]">
                  <strong>🔒 Absolute Account Safety Guarantee:</strong> We never
                  ask for, collect, or store your Genshin Impact UID, HoYoverse
                  account credentials, email passwords, or authentication cookies.
                  You type your own tasks and notes.
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  2. Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Anonymous Mode (Default):</strong> When you create
                    wallpapers without logging in, all daily tasks, weekly boss
                    checklists, notes, and resolution preferences remain stored
                    exclusively in your device’s local browser storage (
                    <code className="bg-black/5 px-1.5 py-0.5 rounded text-xs font-mono">
                      localStorage
                    </code>
                    ). No personal account data is transmitted to or retained on our
                    servers.
                  </li>
                  <li>
                    <strong>Optional User Accounts:</strong> If you choose to
                    register a free account to sync routines and pixel projects
                    across multiple devices, we collect your chosen username or
                    email address and a securely hashed password (salted bcrypt). We
                    store your saved checklist state and private Pixel Studio
                    project snapshots.
                  </li>
                  <li>
                    <strong>Pixel Studio Artwork:</strong> Custom sprite animations,
                    character rigs, and parallax tilemaps you create are saved
                    locally in your browser’s IndexedDB. When logged in, cloud
                    snapshots are stored securely with account-scoped ownership.
                  </li>
                  <li>
                    <strong>Technical & Diagnostic Data:</strong> Like most web
                    servers, our hosting infrastructure may record standard transient
                    HTTP request logs (IP address, user agent, timestamps) for the
                    sole purpose of DDoS mitigation, rate limiting, and system
                    reliability. These logs are not linked to personal identities.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  3. How We Use Your Data
                </h2>
                <p>We process your data strictly to provide the service:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Compositing your selected tasks into customized desktop wallpapers.</li>
                  <li>Synchronizing your tasks and pixel projects across your devices when authenticated.</li>
                  <li>Preventing abusive automated requests and maintaining server uptime.</li>
                </ul>
                <p>
                  <strong>No Commercialization:</strong> We do not sell, rent, monetize,
                  or share your information with any third-party advertisers, data brokers,
                  or marketing agencies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  4. Storage, Cookies & Security
                </h2>
                <p>
                  GenshinWallCraft does not use third-party tracking cookies or advertising
                  pixels. We utilize standard client-side storage (
                  <code className="bg-black/5 px-1.5 py-0.5 rounded text-xs font-mono">
                    localStorage
                  </code>{" "}
                  and{" "}
                  <code className="bg-black/5 px-1.5 py-0.5 rounded text-xs font-mono">
                    IndexedDB
                  </code>
                  ) solely to retain your application preferences and unsaved work.
                </p>
                <p>
                  All network communication between your browser and our servers is
                  encrypted using industry-standard Transport Layer Security (TLS/HTTPS).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  5. Intellectual Property & HoYoverse Rights
                </h2>
                <p>
                  GenshinWallCraft is an open-source, non-profit fan project. All Genshin
                  Impact artwork, splashscreens, character designs, game assets, and
                  associated trademarks are the intellectual property of{" "}
                  <strong>Cognosphere Pte., Ltd. / HoYoverse</strong>.
                </p>
                <p>
                  We claim no ownership over official HoYoverse assets. User-generated
                  pixel art created in Pixel Studio remains the creative property of its
                  respective authors.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  6. Your Rights & Data Deletion
                </h2>
                <p>
                  You have full control over your data at all times:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    To clear local guest tasks, simply clear your browser storage or
                    click "Reset" in the generator sidebar.
                  </li>
                  <li>
                    Registered users may delete their saved Pixel Studio projects
                    directly within the Saved Projects dialog.
                  </li>
                  <li>
                    To request the complete deletion of your account and all associated
                    data, please open an issue or contact our maintainers.
                  </li>
                </ul>
              </section>
            </div>
          ) : (
            /* ─── TERMS OF SERVICE CONTENT ─── */
            <div className="space-y-8 text-sm sm:text-base text-[#151D4D]/85">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or using <strong>GenshinWallCraft</strong> (
                  <span className="font-mono text-xs text-[#C58B35]">
                    genshinwallpaper.nevatal.id
                  </span>
                  ), including the Wallpaper Generator Studio and Pixel Studio, you agree
                  to be bound by these Terms of Service. If you disagree with any part
                  of these terms, please discontinue using the service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  2. Non-Commercial Fan Project Disclaimer
                </h2>
                <p>
                  GenshinWallCraft is a free, non-commercial, open-source productivity
                  organizer created by fans for fans.
                </p>
                <div className="bg-[#FDE7CE]/40 border-l-4 border-[#151D4D] p-4 rounded-r-lg text-xs sm:text-sm text-[#151D4D]">
                  <strong>Disclaimer:</strong> This project is not affiliated with,
                  endorsed by, or sponsored by Cognosphere Pte., Ltd. or HoYoverse.
                  Genshin Impact™ is a registered trademark of Cognosphere / HoYoverse.
                  All rights to official game artwork, character illustrations, and logos
                  belong to their respective owners.
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  3. Permitted Use & Code of Conduct
                </h2>
                <p>
                  You may use GenshinWallCraft to generate wallpapers and pixel artwork
                  for personal, non-commercial desktop and mobile customization. You agree
                  not to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Launch automated denial-of-service (DoS) attacks, automated bulk
                    scraping, or stress tests against our backend rendering endpoints.
                  </li>
                  <li>
                    Attempt to probe, reverse engineer, or exploit vulnerabilities in
                    the authentication or database systems.
                  </li>
                  <li>
                    Use the Service to distribute malicious software, offensive
                    content, or violate applicable local laws.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  4. User Accounts & Passwords
                </h2>
                <p>
                  You are responsible for maintaining the confidentiality of your login
                  credentials. GenshinWallCraft is not liable for unauthorized access
                  resulting from shared or compromised passwords. We recommend using a
                  unique password.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  5. User-Generated Pixel Artwork
                </h2>
                <p>
                  You retain ownership of any original pixel art sprites, animation rigs,
                  and tilesets you design using the Pixel Studio. By utilizing cloud
                  autosave, you grant the Service the technical license required to store,
                  index, and retrieve your project files solely for your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  6. Disclaimer of Warranties
                </h2>
                <p>
                  The Service is provided on an <strong>"AS IS"</strong> and{" "}
                  <strong>"AS AVAILABLE"</strong> basis without warranties of any kind,
                  either express or implied. We do not guarantee that the Service will
                  be uninterrupted, error-free, or that generated wallpapers will be
                  retained indefinitely on our servers. Travelers are encouraged to
                  download and save their generated wallpapers and project backups
                  locally.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-[#151D4D]">
                  7. Changes to Terms
                </h2>
                <p>
                  We reserve the right to update these Terms at any time. When updates
                  occur, the "Effective Date" at the top of this page will be revised.
                  Your continued use of GenshinWallCraft after revisions signifies
                  acceptance of the updated terms.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A102E] text-white/70 py-12 border-t border-white/10 text-xs">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-white font-bold">
              <span className="text-[#C58B35]">✦</span>
              <span>GenshinWallCraft Legal Center</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/80">
              <button
                onClick={() => switchTab("privacy")}
                className={`hover:text-white transition-colors ${
                  activeTab === "privacy" ? "text-white font-semibold underline" : ""
                }`}
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                onClick={() => switchTab("terms")}
                className={`hover:text-white transition-colors ${
                  activeTab === "terms" ? "text-white font-semibold underline" : ""
                }`}
              >
                Terms of Service
              </button>
              <span>·</span>
              <button
                onClick={onNavigateHome}
                className="hover:text-white transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
          <div className="text-[11px] text-white/40 pt-4 border-t border-white/10 leading-relaxed">
            Disclaimer: GenshinWallCraft is not affiliated with, endorsed by, or sponsored
            by Cognosphere Pte., Ltd. or HoYoverse. Genshin Impact and all associated logos,
            artworks, and character designs are trademarks and copyrights of Cognosphere /
            HoYoverse.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
