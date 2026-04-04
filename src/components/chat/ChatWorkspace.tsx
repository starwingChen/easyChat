import { Fragment, type ReactElement } from 'react';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from 'react-resizable-panels';

import type { BotRegistry } from '../../bots/botRegistry';
import { useI18n } from '../../i18n';
import type { ChatSession, SessionSnapshot } from '../../types/session';
import {
  panelPresets,
  type PanelTree,
} from '../../features/layout/panelPresets';
import { ChatPanel } from './ChatPanel';

interface ChatWorkspaceProps {
  availableBotIds: string[];
  botRegistry: BotRegistry;
  currentSession: ChatSession | SessionSnapshot;
  isReadonly: boolean;
  onBotChange: (index: number, botId: string) => void;
  onFocusBotInSingleLayout?: (botId: string) => void;
  onCancelLoading?: (messageId: string) => void;
  onRetryFailed?: (messageId: string) => void;
  onModelChange: (botId: string, modelId: string) => void;
  onAddSavedApiModel?: (botId: string, modelName: string) => void | Promise<void>;
  onRemoveSavedApiModel?: (
    botId: string,
    modelName: string
  ) => void | Promise<void>;
  onSaveApiConfig?: (
    botId: string,
    config: { apiKey: string; modelName: string }
  ) => void;
  visibleBotIds: string[];
}

function ResizeHandle({ direction }: { direction: 'horizontal' | 'vertical' }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center ${
        direction === 'horizontal'
          ? 'w-3 cursor-col-resize'
          : 'h-3 cursor-row-resize'
      }`}
    >
      <div
        className={`rounded-full bg-slate-300 transition group-hover:bg-blue-500 ${
          direction === 'horizontal' ? 'h-8 w-1' : 'h-1 w-8'
        }`}
      />
    </PanelResizeHandle>
  );
}

function EmptySnapshotPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

function renderTree(
  tree: PanelTree,
  props: ChatWorkspaceProps,
  emptySnapshotPanelLabel: string
): ReactElement {
  if (tree.type === 'panel') {
    const botId = props.visibleBotIds[tree.index];

    if (!botId) {
      return (
        <EmptySnapshotPanel
          key={`empty-panel-${tree.index}`}
          label={emptySnapshotPanelLabel}
        />
      );
    }

    const botAdapter = props.botRegistry.getBot(botId);
    const botDefinition = botAdapter.definition;
    const allBotDefinitions = props.botRegistry
      .getAllBots()
      .map((bot) => bot.definition);

    return (
      <ChatPanel
        allBotDefinitions={allBotDefinitions}
        availableBotIds={props.availableBotIds}
        botDefinition={botDefinition}
        configuredModelName={botAdapter.getApiConfig()?.modelName ?? null}
        currentLayout={props.currentSession.layout}
        initialApiConfig={botAdapter.getApiConfig()}
        inUseBotIds={props.visibleBotIds}
        isReadonly={props.isReadonly}
        key={botId}
        messages={props.currentSession.messages}
        onAddSavedApiModel={(modelName) =>
          props.onAddSavedApiModel?.(botId, modelName)
        }
        onBotChange={(nextBotId) => props.onBotChange(tree.index, nextBotId)}
        onFocusBotInSingleLayout={() =>
          props.onFocusBotInSingleLayout?.(botId)
        }
        onCancelLoading={props.onCancelLoading}
        onModelChange={(modelId) => props.onModelChange(botId, modelId)}
        onRemoveSavedApiModel={(modelName) =>
          props.onRemoveSavedApiModel?.(botId, modelName)
        }
        onRetryFailed={props.onRetryFailed}
        onSaveApiConfig={(config) => props.onSaveApiConfig?.(botId, config)}
        savedApiModels={botAdapter.getSavedModels()}
        selectedModelId={
          props.currentSession.selectedModels[botId] ??
          botDefinition.defaultModel
        }
      />
    );
  }

  return (
    <PanelGroup
      key={`${tree.direction}-${tree.children.length}`}
      orientation={tree.direction}
    >
      {tree.children.map((child, index) => (
        <Fragment key={`${tree.direction}-${index}`}>
          <Panel minSize={18}>
            {renderTree(child, props, emptySnapshotPanelLabel)}
          </Panel>
          {index < tree.children.length - 1 ? (
            <ResizeHandle direction={tree.direction} />
          ) : null}
        </Fragment>
      ))}
    </PanelGroup>
  );
}

export function ChatWorkspace(props: ChatWorkspaceProps) {
  const preset = panelPresets[props.currentSession.layout];
  const { t } = useI18n();

  return (
    <div className="min-h-0 flex-1 p-3">
      {renderTree(preset, props, t('chat.emptySnapshotPanel'))}
    </div>
  );
}
