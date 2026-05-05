import React, { useState } from "react";
import { FEATURES, FeatureKey } from "./featureRegistry";
import JarvisSidebar from "./JarvisSidebar";
import JarvisTopBar from "./JarvisTopBar";
import CommandCenter from "./CommandCenter";
import ModulePlaceholder from "./ModulePlaceholder";
import FloatingOrb from "./FloatingOrb";
import StartupLoader from "./StartupLoader";
import MarketsModule from "./modules/MarketsModule";
import TradeAdvisorModule from "./modules/TradeAdvisorModule";
import NewsModule from "./modules/NewsModule";
import SportsModule from "./modules/SportsModule";
import WeatherModule from "./modules/WeatherModule";
import TransportModule from "./modules/TransportModule";
import MoneyModule from "./modules/MoneyModule";
import EarthPulseModule from "./modules/EarthPulseModule";
import UtilitiesModule from "./modules/UtilitiesModule";
import JarvisAvatarModule from "./modules/JarvisAvatarModule";

export default function JarvisOS() {
  const [active, setActive] = useState<FeatureKey>("command-center");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [booting, setBooting] = useState(true);

  const feature = FEATURES.find((f) => f.key === active)!;

  if (booting) return <StartupLoader onDone={() => setBooting(false)} />;

  return (
    <div className="min-h-screen bg-jarvis-grid text-foreground flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <JarvisSidebar
          active={active}
          onSelect={setActive}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-fade-in">
            <JarvisSidebar
              mobile
              active={active}
              onSelect={setActive}
              collapsed={false}
              onToggle={() => {}}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <JarvisTopBar feature={feature} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {active === "command-center" ? (
            <CommandCenter onOpen={setActive} />
          ) : active === "stocks" ? (
            <MarketsModule />
          ) : active === "trade" ? (
            <TradeAdvisorModule />
          ) : active === "news" ? (
            <NewsModule />
          ) : active === "sports" ? (
            <SportsModule />
          ) : active === "weather" ? (
            <WeatherModule />
          ) : active === "transport" ? (
            <TransportModule />
          ) : active === "money" ? (
            <MoneyModule />
          ) : active === "earth" ? (
            <EarthPulseModule />
          ) : active === "utilities" ? (
            <UtilitiesModule />
          ) : (
            <ModulePlaceholder feature={feature} />
          )}
        </main>
      </div>

      <FloatingOrb />
    </div>
  );
}
