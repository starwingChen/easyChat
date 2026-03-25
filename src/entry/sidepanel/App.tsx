import { SidePanelShell } from '../../components/app/SidePanelShell';
import { AppStateProvider } from '../../store/AppStateContext';

export default function App() {
  return (
    <AppStateProvider>
      <SidePanelShell />
    </AppStateProvider>
  );
}
