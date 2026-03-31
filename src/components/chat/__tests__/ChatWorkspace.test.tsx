import type { ReactNode } from "react";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithI18n } from "../../../test/renderWithI18n";
import { createSnapshot } from "../../../../test/factories/snapshot";
import { createBotRegistry } from "../../../bots/botRegistry";
import { ChatWorkspace } from "../ChatWorkspace";

vi.mock("react-resizable-panels", () => ({
  Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Separator: () => <div />,
}));

describe("ChatWorkspace", () => {
  it("renders empty readonly panels when a history layout has more slots than replied bots", () => {
    const registry = createBotRegistry();
    const snapshot = createSnapshot({
      layout: "4",
      activeBotIds: ["chatgpt"],
      messages: [],
    });

    renderWithI18n(
      <ChatWorkspace
        availableBotIds={["chatgpt"]}
        botRegistry={registry}
        currentSession={snapshot}
        isReadonly={true}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        visibleBotIds={["chatgpt"]}
      />,
      { locale: "en-US" },
    );

    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getAllByText("No reply in this snapshot.")).toHaveLength(3);
  });
});
