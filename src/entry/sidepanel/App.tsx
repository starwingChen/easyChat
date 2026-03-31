import { SidePanelShell } from "../../components/app/SidePanelShell";
import { AppI18nProvider } from "../../i18n";
import { AppStateProvider } from "../../store/AppStateContext";
import { useAppState } from "../../store/AppStateContext";

function I18nAwareSidePanelShell() {
  const { state } = useAppState();

  return (
    <AppI18nProvider locale={state.locale}>
      <SidePanelShell />
    </AppI18nProvider>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <I18nAwareSidePanelShell />
    </AppStateProvider>
  );
}
