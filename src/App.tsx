import { MainView } from './components/MainView';
import { OrthoView } from './components/OrthoView';
import { ViewPanel } from './components/ViewPanel';
import { Toolbar } from './components/Toolbar';
import { useViewStore } from './store/viewStore';
import './App.css';

export default function App() {
  const visibleViews = useViewStore((s) => s.visibleViews);

  return (
    <div className="app">
      <Toolbar />
      <div className="main-layout">
        <MainView />
        <div className="ortho-grid">
          {Array.from(visibleViews).map((dir) => (
            <OrthoView key={dir} direction={dir} />
          ))}
        </div>
      </div>
      <ViewPanel />
    </div>
  );
}
