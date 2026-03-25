import { Fragment, type ReactElement } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import type { BotRegistry } from '../../bots/botRegistry';
import type { ChatSession, SessionSnapshot } from '../../types/session';
import { panelPresets, type PanelTree } from '../../features/layout/panelPresets';
import { ChatPanel } from './ChatPanel';

interface ChatWorkspaceProps {
  botRegistry: BotRegistry;
  currentSession: ChatSession | SessionSnapshot;
  isReadonly: boolean;
  onBotChange: (index: number, botId: string) => void;
  onModelChange: (botId: string, modelId: string) => void;
  t: (key: string) => string;
  visibleBotIds: string[];
}

function ResizeHandle({ direction }: { direction: 'horizontal' | 'vertical' }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center ${
        direction === 'horizontal' ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'
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

function renderTree(
  tree: PanelTree,
  props: ChatWorkspaceProps,
): ReactElement {
  if (tree.type === 'panel') {
    const botId = props.visibleBotIds[tree.index];
    const botDefinition = props.botRegistry.getBot(botId).definition;
    const availableBotDefinitions = props.botRegistry
      .getAllBots()
      .map((bot) => bot.definition)
      .filter((bot) => !props.visibleBotIds.includes(bot.id) || bot.id === botId)
      .filter((bot) => bot.id !== botId);

    return (
      <ChatPanel
        availableBotDefinitions={availableBotDefinitions}
        botDefinition={botDefinition}
        isReadonly={props.isReadonly}
        key={botId}
        messages={props.currentSession.messages}
        onBotChange={(nextBotId) => props.onBotChange(tree.index, nextBotId)}
        onModelChange={(modelId) => props.onModelChange(botId, modelId)}
        selectedModelId={props.currentSession.selectedModels[botId] ?? botDefinition.defaultModel}
        t={props.t}
      />
    );
  }

  return (
    <PanelGroup key={`${tree.direction}-${tree.children.length}`} orientation={tree.direction}>
      {tree.children.map((child, index) => (
        <Fragment key={`${tree.direction}-${index}`}>
          <Panel minSize={18}>{renderTree(child, props)}</Panel>
          {index < tree.children.length - 1 ? <ResizeHandle direction={tree.direction} /> : null}
        </Fragment>
      ))}
    </PanelGroup>
  );
}

export function ChatWorkspace(props: ChatWorkspaceProps) {
  const preset = panelPresets[props.currentSession.layout];

  return <div className="min-h-0 flex-1 p-3">{renderTree(preset, props)}</div>;
}
