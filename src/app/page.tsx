'use client';

import { useSyncExternalStore } from 'react';
import { Sidebar, MobileBottomBar } from '@/components/shabah/sidebar';
import { HomeScreen } from '@/components/search-engine/home-screen';
import { ResultsView } from '@/components/search-engine/results-view';
import { ProxyView } from '@/components/search-engine/proxy-view';
import { SettingsView } from '@/components/shabah/settings-view';
import { AdminDashboard } from '@/components/shabah/admin-dashboard';
import { AiPanel } from '@/components/shabah/ai-panel';
import { Footer } from '@/components/search-engine/footer';
import { SettingsSync } from '@/components/shabah/settings-sync';
import { useSearchStore } from '@/store/search-store';
import { usePrivacyStore } from '@/store/privacy-store';

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function AppShell() {
  const view = useSearchStore((s) => s.view);
  const initialize = usePrivacyStore((s) => s.initialize);
  const initialized = usePrivacyStore((s) => s.initialized);

  // Initialize privacy store client-side (populates random circuit data)
  // Using ref guard to call only once
  const initRef = { called: false };
  if (!initRef.called && typeof window !== 'undefined' && !initialized) {
    initRef.called = true;
    initialize();
  }

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomeScreen />;
      case 'results':
        return <ResultsView />;
      case 'proxy':
        return <ProxyView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SettingsSync />
      {/* Sidebar — desktop */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>

        {/* Footer (sticky to bottom) */}
        <Footer />
      </div>

      {/* AI Panel overlay */}
      <AiPanel />

      {/* Mobile bottom navigation */}
      <MobileBottomBar />
    </div>
  );
}

export default function Home() {
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="text-primary text-lg font-bold">ش</span>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
