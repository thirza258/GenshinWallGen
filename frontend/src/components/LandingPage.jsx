import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Is GenshinWallCraft free to use?",
    answer:
      "Yes, GenshinWallCraft is 100% free and open-source. You can generate unlimited high-resolution wallpapers without any subscriptions, ads, or paywalls.",
  },
  {
    question: "Do I need to create an account or provide my Genshin UID?",
    answer:
      "No! We never ask for your Genshin UID, HoYoverse password, or credentials. Anonymous mode lets you craft and download wallpapers instantly. If you choose to create a free account, it simply saves your task list and generated wallpaper history across your devices.",
  },
  {
    question: "What screen resolutions are supported?",
    answer:
      "We support 3840×2160 (4K UHD), 2560×1440 (2K QHD), 1920×1080 (Full HD), 1366×768 (Laptop), and 1280×720 (HD). Every wallpaper is rendered with pixel-perfect font scaling.",
  },
  {
    question: "How do I set the downloaded image as my desktop background?",
    answer:
      "On Windows: Right-click the downloaded PNG file and select 'Set as desktop background'. On macOS: Right-click the image and select 'Set Desktop Picture'. On Linux: Right-click the wallpaper in your file manager or use your desktop environment settings.",
  },
  {
    question: "Can I customize the tasks, weekly bosses, and notes?",
    answer:
      "Absolutely. You can add, edit, check off, or delete daily commissions, weekly trounce bosses, artifact farming schedules, and custom freeform notes (like talent book days or pity counters).",
  },
  {
    question: "What artworks are included?",
    answer:
      "Our collection includes over 50 official Genshin Impact splashscreens and launcher artworks spanning Mondstadt, Liyue, Inazuma, Sumeru, Fontaine, Natlan, and special seasonal version updates.",
  },
];

const PRESETS = [
  {
    id: "farmer",
    title: "🎯 Hardcore Daily Farmer",
    desc: "For Travelers maximizing daily resin, artifact exp, and commissions",
    daily: [
      { id: "p1", text: "4 Daily Commissions + Katheryne Reward", done: false },
      { id: "p2", text: "Spend 160-200 Condensed Resin on Artifacts", done: false },
      { id: "p3", text: "Collect 5 Expeditions & Teapot Realm Currency", done: false },
      { id: "p4", text: "Craft 30 Mystic Enhancement Ore at Blacksmith", done: false },
    ],
    weekly: [
      { id: "pw1", text: "3 Discounted Weekly Bosses (Arlecchino / Narwhal)", done: false },
      { id: "pw2", text: "Reputation: 3 Bounties & 3 Requests", done: false },
      { id: "pw3", text: "Spiral Abyss Floor 9-12 Stars Check", done: false },
    ],
    notes: "Talent Book Days: Tue/Fri (Guide to Equity). Condensed resin cap: 5/5.",
    image: "Splashscreen_Masquerade_of_the_Guilty.png",
  },
  {
    id: "boss_hunter",
    title: "⚔️ Weekly Boss & Talent Hunter",
    desc: "Focus on talent ascensions, weekly trounce domains, and weapon materials",
    daily: [
      { id: "p5", text: "Daily Commission 60 Primogems", done: false },
      { id: "p6", text: "Domain Run: Talent Books for main DPS", done: false },
      { id: "p7", text: "Local Specialty gathering (168 mats)", done: false },
    ],
    weekly: [
      { id: "pw4", text: "Trounce Boss: The Knave (Arlecchino)", done: false },
      { id: "pw5", text: "Trounce Boss: All-Devouring Narwhal", done: false },
      { id: "pw6", text: "Trounce Boss: Guardian of Apep's Oasis", done: false },
      { id: "pw7", text: "Weekly Teapot Transient Resin Purchase", done: false },
    ],
    notes: "Talents target: 9/9/9. Farm Weapon domain on Wednesday & Saturday.",
    image: "5.0 Launcher Art.png",
  },
  {
    id: "f2p_saver",
    title: "💎 F2P Primogem & Banner Saver",
    desc: "Track pity counter, daily primogems, events, and banner savings",
    daily: [
      { id: "p8", text: "Claim 90 Welkin Moon Primogems", done: false },
      { id: "p9", text: "Complete 4 Daily Commissions (60 Primos)", done: false },
      { id: "p10", text: "HoYoLAB Daily Web Check-In", done: false },
      { id: "p11", text: "Check Limited-Time Version Event Tasks", done: false },
    ],
    weekly: [
      { id: "pw8", text: "Clear Weekly Battle Pass Missions", done: false },
      { id: "pw9", text: "Parametric Transformer Reset", done: false },
      { id: "pw10", text: "Imaginarium Theater & Spiral Abyss Reset", done: false },
    ],
    notes: "Character Banner Pity: 68/90 (Guaranteed). Savings: 14,400 Primos (90 Fates).",
    image: "Splashscreen_When_the_Sakura_Bloom.png",
  },
];

const SHOWCASE_CARDS = [
  {
    name: "Natlan: Saurian Champions",
    region: "Natlan (5.0+)",
    file: "5.0 Launcher Art.png",
    color: "from-amber-600 to-red-700",
    desc: "Vibrant volcanic landscapes and brave Saurian companions from the Nation of Pyro.",
  },
  {
    name: "Fontaine: Masquerade of the Guilty",
    region: "Fontaine (4.2)",
    file: "Splashscreen_Masquerade_of_the_Guilty.png",
    color: "from-blue-700 to-indigo-900",
    desc: "The grandeur of the Opera Epiclese featuring Furina and the judgment of Fontaine.",
  },
  {
    name: "Inazuma: When the Sakura Bloom",
    region: "Inazuma (2.5)",
    file: "Splashscreen_When_the_Sakura_Bloom.png",
    color: "from-purple-800 to-pink-700",
    desc: "Sacred Sakura blossoms, the Narukami Shrine, and eternal lightning.",
  },
  {
    name: "Liyue: Fleeting Colors in Flight",
    region: "Liyue (2.4)",
    file: "Splashscreen_Fleeting_Colors_in_Flight.png",
    color: "from-amber-700 to-orange-900",
    desc: "Liyue Harbor illuminated by thousands of Lantern Rite lanterns and fireworks.",
  },
  {
    name: "Sumeru: Akasha Pulses & Kalpa Flame",
    region: "Sumeru (3.2)",
    file: "Splashscreen_Akasha_Pulses2C_the_Kalpa_Flame_Rises.png",
    color: "from-emerald-800 to-teal-950",
    desc: "The Sanctuary of Surasthana and the radiant wisdom of Lord Kusanali.",
  },
  {
    name: "Mondstadt: Welcome to Teyvat",
    region: "Mondstadt (1.0)",
    file: "Splashscreen_Welcome_To_Teyvat.png",
    color: "from-sky-700 to-teal-800",
    desc: "The iconic cliffs of Starsnatch, Windrise tree, and the beginning of your journey.",
  },
];

const DEMO_THEMES = [
  {
    id: "natlan",
    label: "🔥 Natlan 5.0",
    name: "5.0 Launcher Art.png",
    bgClass: "bg-gradient-to-br from-[#4A1517] via-[#2A1015] to-[#151D4D]",
  },
  {
    id: "fontaine",
    label: "🌊 Fontaine",
    name: "Splashscreen_Masquerade_of_the_Guilty.png",
    bgClass: "bg-gradient-to-br from-[#0F2847] via-[#151D4D] to-[#0A122A]",
  },
  {
    id: "inazuma",
    label: "⚡ Inazuma",
    name: "Splashscreen_When_the_Sakura_Bloom.png",
    bgClass: "bg-gradient-to-br from-[#2D124D] via-[#1F1540] to-[#151D4D]",
  },
  {
    id: "liyue",
    label: "🪨 Liyue",
    name: "Splashscreen_Fleeting_Colors_in_Flight.png",
    bgClass: "bg-gradient-to-br from-[#402610] via-[#2D1B0C] to-[#151D4D]",
  },
];

const LandingPage = ({
  onGetStarted,
  onApplyPreset,
  isAuthenticated,
  onLoginClick,
  onLogout,
  onOpenPixelStudio,
}) => {
  const [activeFaq, setActiveFaq] = useState(0);
  const [demoTheme, setDemoTheme] = useState(DEMO_THEMES[0]);
  const [demoTasks, setDemoTasks] = useState([
    { id: "d1", text: "4 Daily Commissions + Katheryne (+20 Primos)", done: true },
    { id: "d2", text: "Spend 160 Condensed Resin in Artifact Domain", done: true },
    { id: "d3", text: "Collect 5 Expeditions & Realm Currency", done: true },
    { id: "d4", text: "Forge 30 Mystic Enhancement Ore & Daily BP", done: false },
  ]);
  const [demoWeekly, setDemoWeekly] = useState([
    { id: "dw1", text: "Weekly Boss: The Knave (Arlecchino)", done: true },
    { id: "dw2", text: "Weekly Boss: All-Devouring Narwhal", done: false },
    { id: "dw3", text: "Reputation: 3 Bounties & 3 Requests", done: false },
  ]);

  const toggleDemoTask = (id) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const toggleDemoWeekly = (id) => {
    setDemoWeekly((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDE7CE] text-[#151D4D] selection:bg-[#151D4D] selection:text-[#FFFCF3]">
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-40 bg-[#FFFCF3]/90 backdrop-blur-md border-b border-black/15 transition-all">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#151D4D] to-[#2B3B99] flex items-center justify-center text-[#FFE8A3] shadow-md shadow-black/10">
              <span className="text-xl">✦</span>
            </div>
            <div>
              <div className="font-mono text-lg sm:text-xl font-bold tracking-tight text-[#151D4D]">
                GenshinWall<span className="text-[#C58B35]">Craft</span>
              </div>
              <div className="text-[10px] text-[#151D4D]/60 tracking-wider uppercase hidden sm:block">
                Daily Task Wallpaper Studio
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#pixel-studio" onClick={onOpenPixelStudio} className="text-[#687D51] hover:text-[#151D4D] transition-colors font-semibold">Pixel Studio</a>
            <a
              href="#features"
              className="text-[#151D4D]/80 hover:text-[#151D4D] transition-colors"
            >
              Features
            </a>
            <a
              href="#showcase"
              className="text-[#151D4D]/80 hover:text-[#151D4D] transition-colors"
            >
              Wallpapers
            </a>
            <a
              href="#presets"
              className="text-[#151D4D]/80 hover:text-[#151D4D] transition-colors"
            >
              Presets
            </a>
            <a
              href="#how-it-works"
              className="text-[#151D4D]/80 hover:text-[#151D4D] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-[#151D4D]/80 hover:text-[#151D4D] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Auth & CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#151D4D] bg-[#151D4D]/10 px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
                  ✓ Logged In
                </span>
                <button
                  onClick={onLogout}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-black/5 hover:bg-black/10 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#151D4D]/10 text-[#151D4D] hover:bg-[#151D4D]/15 transition-all"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => onGetStarted()}
              id="nav-get-started-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#151D4D] to-[#0A102E] text-[#FFFCF3] text-xs sm:text-sm font-semibold shadow-md shadow-[#151D4D]/25 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <span>Get Started</span>
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
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle Decorative Stars */}
        <div className="absolute top-10 left-10 text-[#C58B35]/40 text-2xl animate-twinkle select-none pointer-events-none">
          ✦
        </div>
        <div className="absolute top-36 right-16 text-[#C58B35]/30 text-3xl animate-twinkle select-none pointer-events-none delay-500">
          ✧
        </div>
        <div className="absolute bottom-20 left-1/4 text-[#151D4D]/20 text-xl animate-twinkle select-none pointer-events-none delay-1000">
          ✦
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151D4D]/10 border border-[#151D4D]/20 text-xs font-semibold tracking-wide text-[#151D4D]">
              <span className="text-[#C58B35]">✦</span>
              <span>The Free Genshin Impact Daily Task Wallpaper Studio</span>
            </div>

            {/* Main H1 Headline for SEO & UX */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#151D4D] leading-[1.15]">
              Turn Your Daily Routine into{" "}
              <span className="relative inline-block text-[#C58B35]">
                Aesthetic 4K Wallpapers
                <span className="absolute left-0 bottom-1 w-full h-1 bg-[#C58B35]/30 rounded-full"></span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#151D4D]/80 leading-relaxed max-w-2xl mx-auto">
              Overlay your daily commissions, weekly boss drops, resin reminders,
              and farming notes directly onto official high-res Genshin artwork.
              Stay organized, save banner wishes, and elevate your desktop setup.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onGetStarted()}
                id="hero-get-started-btn"
                className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#151D4D] via-[#1A2560] to-[#0A102E] text-[#FFFCF3] text-base font-bold shadow-xl shadow-[#151D4D]/30 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all group"
              >
                <span>Launch Generator Free</span>
                <span className="text-[#FFE8A3] group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              <a
                href="#showcase"
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[#FFFCF3] border border-black/15 text-[#151D4D] text-base font-semibold hover:bg-black/5 transition-all shadow-sm"
              >
                <span>Explore Wallpapers</span>
                <span className="text-sm">↓</span>
              </a>
              <button onClick={onOpenPixelStudio} id="hero-pixel-studio-btn" className="flex items-center gap-2 px-6 py-4 rounded-xl bg-[#E3E9D7] border border-[#AFBC96] text-[#3B5037] text-base font-semibold hover:bg-[#D6E1C7] transition-all shadow-sm">
                <span>▦</span> Create Pixel Art <span>→</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 pt-4 text-xs font-semibold text-[#151D4D]/75">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span> 100% Free Forever
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span> 50+ Official 4K Artworks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span> Instant Anonymous Mode
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-700">✓</span> Multi-Monitor Ready
              </span>
            </div>
          </div>

          {/* ─── INTERACTIVE LIVE WALLPAPER SIMULATOR / HERO MOCKUP ─── */}
          <div className="mt-14 max-w-5xl mx-auto">
            {/* Theme switcher bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFCF3] border border-black/15 rounded-t-2xl p-3 px-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-mono font-semibold text-[#151D4D]/70 ml-2 hidden sm:inline">
                  Interactive Live Simulator
                </span>
              </div>

              {/* Theme selector buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-xs text-[#151D4D]/60 mr-1 hidden md:inline">
                  Region Theme:
                </span>
                {DEMO_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setDemoTheme(theme)}
                    className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all shrink-0 ${
                      demoTheme.id === theme.id
                        ? "bg-[#151D4D] text-[#FFFCF3] shadow-sm"
                        : "bg-[#FDE7CE]/60 text-[#151D4D] hover:bg-[#FDE7CE]"
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Mockup Screen */}
            <div
              className={`relative border-x border-b border-black/20 rounded-b-2xl overflow-hidden shadow-2xl p-4 sm:p-8 min-h-[460px] flex flex-col justify-between ${demoTheme.bgClass} transition-colors duration-500`}
            >
              {/* Background ambient lights */}
              <div className="absolute inset-0 bg-black/35 pointer-events-none"></div>

              {/* Inner Wallpaper Task Overlay Card Simulation */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                {/* Daily Tasks Card */}
                <div className="bg-[#FFFCF3]/95 backdrop-blur-md border border-black/15 rounded-xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-black/10">
                    <div className="font-mono text-xs uppercase tracking-wider text-[#151D4D] font-bold flex items-center gap-1.5">
                      <span className="text-[#C58B35]">✦</span> DAILY COMMISSIONS
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-[#151D4D]/10 text-[#151D4D] px-2 py-0.5 rounded">
                      {demoTasks.filter((t) => t.done).length}/{demoTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {demoTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => toggleDemoTask(t.id)}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FDE7CE]/40 hover:bg-[#FDE7CE]/80 cursor-pointer transition-all border border-transparent hover:border-black/10 select-none"
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${
                            t.done
                              ? "bg-[#151D4D] text-white"
                              : "border border-[#151D4D]/40"
                          }`}
                        >
                          {t.done && <span className="text-[10px]">✓</span>}
                        </div>
                        <span
                          className={`text-xs text-[#151D4D] ${
                            t.done
                              ? "line-through text-[#151D4D]/50 font-normal"
                              : "font-semibold"
                          }`}
                        >
                          {t.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Bosses & Notes Card */}
                <div className="space-y-4">
                  {/* Weekly Bosses */}
                  <div className="bg-[#FFFCF3]/95 backdrop-blur-md border border-black/15 rounded-xl p-5 shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-black/10">
                      <div className="font-mono text-xs uppercase tracking-wider text-[#151D4D] font-bold flex items-center gap-1.5">
                        <span className="text-[#C58B35]">✦</span> WEEKLY BOSSES (30 RESIN)
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-[#151D4D]/10 text-[#151D4D] px-2 py-0.5 rounded">
                        {demoWeekly.filter((t) => t.done).length}/{demoWeekly.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {demoWeekly.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => toggleDemoWeekly(t.id)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FDE7CE]/40 hover:bg-[#FDE7CE]/80 cursor-pointer transition-all border border-transparent hover:border-black/10 select-none"
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 ${
                              t.done
                                ? "bg-[#151D4D] text-white"
                                : "border border-[#151D4D]/40"
                            }`}
                          >
                            {t.done && <span className="text-[10px]">✓</span>}
                          </div>
                          <span
                            className={`text-xs text-[#151D4D] ${
                              t.done
                                ? "line-through text-[#151D4D]/50 font-normal"
                                : "font-semibold"
                            }`}
                          >
                            {t.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes Callout */}
                  <div className="bg-[#FFFCF3]/90 backdrop-blur-md border border-black/15 rounded-xl p-3.5 text-xs text-[#151D4D] space-y-1">
                    <div className="font-mono text-[10px] uppercase font-bold text-[#151D4D]/60">
                      Farming Notes & Goals
                    </div>
                    <p className="font-medium text-[#151D4D]/90">
                      ✦ Talent Books: Tuesday & Friday (Guide to Equity)
                      <br />
                      ✦ Banner Pity: 65/90 (Next 5★ Guaranteed)
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Launch Bar inside Mockup */}
              <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-2 text-xs font-mono text-white/80">
                  <span>✦ 3840×2160 Ultra 4K Canvas Output</span>
                  <span className="hidden sm:inline">· Instant Render</span>
                </div>
                <button
                  onClick={() =>
                    onGetStarted({
                      image_id: demoTheme.name,
                      daily: demoTasks,
                      weekly: demoWeekly,
                    })
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FFE8A3] text-[#151D4D] text-xs font-bold hover:bg-white transition-all shadow-md"
                >
                  <span>Edit in Studio Generator</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CORE FEATURES SECTION ─── */}
      <section id="features" className="py-20 bg-[#FFFCF3] border-y border-black/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-[#C58B35] font-bold">
              Productivity Meets Teyvat
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
              Everything You Need to Master Your Daily Genshin Checklist
            </h2>
            <p className="text-sm sm:text-base text-[#151D4D]/75">
              No more forgetting weekly boss discounts, missing weapon domain
              days, or capping resin. Keep your progress visible every time you look at your desktop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                ✓
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Dynamic Task & Boss Checklists
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Add, check off, or edit your daily commissions, 200 resin cap
                reminders, expedition dispatches, and weekly trounce domain bosses.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                🎨
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                50+ Official High-Res Artworks
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Choose from stunning splashscreens and launcher art spanning
                Natlan, Fontaine, Sumeru, Inazuma, Liyue, and Mondstadt.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                🖥️
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Native 4K & Multi-Resolution
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Renders razor-sharp wallpapers for 3840×2160 (4K UHD), 2560×1440
                (2K QHD), 1920×1080 (FHD), and laptop screens with zero blurring.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Anonymous Mode & Cloud Sync
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Zero friction: generate and download instantly as a guest, or log in to sync your saved tasks and download history across PCs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                📝
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Custom Talent & Wish Notes
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Pin your character pity count, weapon ascension schedules,
                artifact substat goals, and version banner savings.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#FDE7CE]/40 border border-black/15 rounded-2xl p-7 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#151D4D] text-[#FFE8A3] flex items-center justify-center text-xl shadow-md">
                ✨
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Authentic Genshin Typography
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed">
                Crafted with the genuine Genshin Impact typeface, optimal
                contrast, and sleek semi-transparent cards that fit seamlessly around your desktop icons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WALLPAPER SHOWCASE & PRESET GALLERY ─── */}
      <section id="showcase" className="py-20 bg-[#FDE7CE]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-[#C58B35] font-bold">
              Official Artwork Showcase
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
              Choose from 50+ Iconic Genshin Splashscreens
            </h2>
            <p className="text-sm sm:text-base text-[#151D4D]/75">
              Click any artwork below to immediately open it in the Generator studio and craft your custom task wallpaper.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SHOWCASE_CARDS.map((card) => (
              <div
                key={card.name}
                className="bg-[#FFFCF3] border border-black/15 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div
                  className={`h-40 bg-gradient-to-tr ${card.color} p-5 flex flex-col justify-between relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-black/40 text-white font-bold backdrop-blur-sm">
                      {card.region}
                    </span>
                    <span className="text-xs text-[#FFE8A3] font-mono font-bold">
                      4K UHD
                    </span>
                  </div>
                  <div className="relative z-10 text-white font-bold text-lg drop-shadow-md">
                    {card.name}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-[#151D4D]/70 leading-relaxed">
                    {card.desc}
                  </p>
                  <button
                    onClick={() => onGetStarted({ image_id: card.file })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#151D4D]/10 hover:bg-[#151D4D] text-[#151D4D] hover:text-[#FFFCF3] font-semibold text-xs transition-all"
                  >
                    <span>Use This Artwork</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUICK STARTER ARCHETYPES / PRESETS ─── */}
      <section id="presets" className="py-20 bg-[#FFFCF3] border-y border-black/15">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-[#C58B35] font-bold">
              1-Click Starters
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
              Select a Routine Template to Get Started
            </h2>
            <p className="text-sm sm:text-base text-[#151D4D]/75">
              Not sure where to begin? Choose one of our pre-configured task setups tailored for different traveler playstyles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-[#FDE7CE]/35 border border-black/15 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:shadow-lg hover:border-[#151D4D]/40 transition-all"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#151D4D]">
                      {preset.title}
                    </h3>
                    <p className="text-xs text-[#151D4D]/70 mt-1">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-black/10 pt-3">
                    <div className="text-[11px] font-mono font-bold uppercase text-[#151D4D]/60">
                      Sample Daily Tasks:
                    </div>
                    {preset.daily.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-[#151D4D]/90 flex items-start gap-2"
                      >
                        <span className="text-[#C58B35] font-bold">✦</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t border-black/10 pt-3">
                    <div className="text-[11px] font-mono font-bold uppercase text-[#151D4D]/60">
                      Weekly Bosses:
                    </div>
                    {preset.weekly.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-[#151D4D]/90 flex items-start gap-2"
                      >
                        <span className="text-[#C58B35] font-bold">✦</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onApplyPreset(preset)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#151D4D] text-[#FFFCF3] font-bold text-xs shadow-md hover:bg-[#25327A] transition-all"
                >
                  <span>Use This Template</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (3 STEPS) ─── */}
      <section id="how-it-works" className="py-20 bg-[#FDE7CE]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-[#C58B35] font-bold">
              Effortless 3-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
              How to Create Your Custom Wallpaper
            </h2>
            <p className="text-sm sm:text-base text-[#151D4D]/75">
              Generating your personalized Genshin task wallpaper takes less than 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#FFFCF3] border border-black/15 rounded-2xl p-7 space-y-4 relative shadow-sm">
              <div className="text-4xl font-mono font-bold text-[#C58B35]/40">
                01
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Enter Tasks & Goals
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/75 leading-relaxed">
                Add your daily commissions, weekly trounce bosses, artifact
                farming schedules, and resin goals in the sidebar.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FFFCF3] border border-black/15 rounded-2xl p-7 space-y-4 relative shadow-sm">
              <div className="text-4xl font-mono font-bold text-[#C58B35]/40">
                02
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Select Artwork & Size
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/75 leading-relaxed">
                Choose your favorite character splashscreen or regional launcher
                artwork and set your monitor resolution (1080p to 4K).
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FFFCF3] border border-black/15 rounded-2xl p-7 space-y-4 relative shadow-sm">
              <div className="text-4xl font-mono font-bold text-[#C58B35]/40">
                03
              </div>
              <h3 className="text-lg font-bold text-[#151D4D]">
                Generate & Set Wallpaper
              </h3>
              <p className="text-xs sm:text-sm text-[#151D4D]/75 leading-relaxed">
                Click Generate to produce the high-res PNG file, download it,
                and set it as your computer desktop background.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (SEO ACCORDION) ─── */}
      <section id="faq" className="py-20 bg-[#FFFCF3] border-t border-black/15">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="text-center space-y-4 mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-[#C58B35] font-bold">
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#151D4D]">
              Everything You Need to Know
            </h2>
            <p className="text-sm sm:text-base text-[#151D4D]/75">
              Got questions about using GenshinWallCraft? Find quick answers below.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={faq.question}
                className="bg-[#FDE7CE]/30 border border-black/15 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-[#151D4D] hover:bg-[#FDE7CE]/60 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="text-lg font-mono ml-4 text-[#C58B35]">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#151D4D]/80 leading-relaxed border-t border-black/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CALL TO ACTION ─── */}
      <section className="py-20 bg-[#151D4D] text-white relative overflow-hidden">
        {/* Decorative Sparkles */}
        <div className="absolute top-8 left-12 text-[#FFE8A3]/30 text-3xl select-none">
          ✦
        </div>
        <div className="absolute bottom-8 right-16 text-[#FFE8A3]/30 text-3xl select-none">
          ✧
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#FFE8A3]">
            <span>✦</span>
            <span>Free · Fast · No Registration Required</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Ready to Upgrade Your Genshin Impact Desktop Setup?
          </h2>

          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Create your custom 4K task wallpaper now and never miss a daily commission, weekly boss reset, or resin cap again.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onGetStarted()}
              id="cta-get-started-btn"
              className="px-9 py-4 rounded-xl bg-[#FFE8A3] text-[#151D4D] text-base font-bold shadow-2xl hover:bg-white hover:scale-105 active:scale-100 transition-all inline-flex items-center gap-3"
            >
              <span>Launch Wallpaper Generator</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER & SEO LINKS ─── */}
      <footer className="bg-[#0A102E] text-white/70 py-14 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5 text-white font-mono text-base font-bold">
                <span className="text-[#FFE8A3]">✦</span>
                <span>GenshinWallCraft</span>
              </div>
              <p className="text-xs text-white/60 max-w-sm leading-relaxed">
                Free daily task & weekly boss wallpaper organizer for Genshin Impact players. Craft customized 4K desktop backgrounds with official artwork.
              </p>
              <div className="text-[11px] text-white/40 pt-2">
                © {new Date().getFullYear()} GenshinWallCraft. Open-source fan-made productivity tool.
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <div className="text-white font-semibold font-mono text-xs uppercase tracking-wider">
                Quick Navigation
              </div>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#showcase"
                    className="hover:text-white transition-colors"
                  >
                    Wallpaper Gallery
                  </a>
                </li>
                <li>
                  <a
                    href="#presets"
                    className="hover:text-white transition-colors"
                  >
                    Preset Routines
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <div className="text-white font-semibold font-mono text-xs uppercase tracking-wider">
                Generator Studio
              </div>
              <ul className="space-y-2 text-white/70">
                <li>
                  <button
                    onClick={() => onGetStarted()}
                    className="hover:text-white transition-colors text-left"
                  >
                    ✦ Open Studio Generator
                  </button>
                </li>
                <li>
                  <button
                    onClick={onLoginClick}
                    className="hover:text-white transition-colors text-left"
                  >
                    ✦ Sign In / Register
                  </button>
                </li>
                <li>
                  <span className="text-white/40">
                    Resolutions: 4K, 2K, 1080p, HD
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal / Disclaimer Notice */}
          <div className="pt-8 border-t border-white/10 text-[11px] text-white/40 leading-relaxed">
            <p>
              Disclaimer: GenshinWallCraft is not affiliated with, endorsed by, or sponsored by Cognosphere Pte., Ltd. or HoYoverse. Genshin Impact and all associated logos, artworks, and character designs are trademarks and copyrights of Cognosphere / HoYoverse.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
