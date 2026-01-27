'use client';

import { observer } from 'mobx-react-lite';
import { uiStore } from '@/stores/UIStore';
import WelcomePage from './(screens)/welcome/page';
import PersonalizePage from './(screens)/personalize/page';
import CapturePage from './(screens)/capture/page';
import ProcessingPage from './(screens)/processing/page';
import ResultsPage from './(screens)/results/page';
import { useEffect } from 'react';

export default observer(function Home() {
  // Ensure welcome screen is shown on initial load
  useEffect(() => {
    if (uiStore.currentScreen !== 'welcome' && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/' || path.startsWith('/welcome')) {
        uiStore.navigateTo('welcome');
      }
    }
  }, []);

  const renderScreen = () => {
    switch (uiStore.currentScreen) {
      case 'welcome':
        return <WelcomePage />;
      case 'personalize':
        return <PersonalizePage />;
      case 'capture':
        return <CapturePage />;
      case 'processing':
        return <ProcessingPage />;
      case 'results':
        return <ResultsPage />;
      default:
        return <WelcomePage />;
    }
  };

  return <>{renderScreen()}</>;
});
