import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithI18n } from "../../test/renderWithI18n";
import { LayoutSwitcher } from "./LayoutSwitcher";

describe("LayoutSwitcher", () => {
  it("renders five layout actions and changes layout on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithI18n(<LayoutSwitcher currentLayout="2h" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /grid/i }));

    expect(onChange).toHaveBeenCalledWith("4");
    expect(
      screen.getByRole("button", { name: /split horizontal/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("disables unsupported history layouts", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithI18n(
      <LayoutSwitcher
        currentLayout="2v"
        disabledLayouts={["3", "4"]}
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole("button", { name: /three columns/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /grid/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /grid/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
