import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithI18n } from "../../../test/renderWithI18n";
import { SidebarSettingsDialog } from "../SidebarSettingsDialog";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SidebarSettingsDialog", () => {
  it("keeps the dialog open after toggling locale and opens the Chrome shortcuts page", async () => {
    const user = userEvent.setup();
    const onToggleLocale = vi.fn();
    const onOpenChange = vi.fn();
    const createTab = vi.fn();

    vi.stubGlobal("chrome", {
      tabs: {
        create: createTab,
      },
    });

    renderWithI18n(
      <SidebarSettingsDialog
        open={true}
        onOpenChange={onOpenChange}
        onToggleLocale={onToggleLocale}
      />,
      { locale: "zh-CN" },
    );

    expect(screen.getByRole("heading", { name: "配置" })).toBeInTheDocument();
    expect(
      screen.queryByText("在这里调整侧边栏的语言与快捷键相关设置。"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("立即切换界面语言，当前弹窗会保持打开。"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "如需修改用于打开或关闭 EasyChat 侧边栏的快捷键，请前往 Chrome 扩展快捷键页面。",
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("默认快捷键：Windows 为 Alt+J，macOS 为 Option+J"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "前往 chrome://extensions/shortcuts 修改",
      }),
    );

    expect(createTab).toHaveBeenCalledWith({
      url: "chrome://extensions/shortcuts",
    });

    await user.click(screen.getByRole("button", { name: "切换中英文" }));

    expect(onToggleLocale).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "配置" })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
