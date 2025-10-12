import { fireEvent, render, screen } from "@testing-library/react";
import HomePage, { TUTORIAL_STORAGE_KEY } from "./page";

describe("Landing tutorial modal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("displays tutorial on first visit and persists acknowledgement", () => {
    render(<HomePage />);

    const tutorialDialog = screen.getByRole("dialog", {
      name: "Play As You Like チュートリアル",
    });

    expect(tutorialDialog).toBeInTheDocument();

    const understandButton = screen.getByRole("button", {
      name: "理解しました",
    });
    fireEvent.click(understandButton);

    expect(
      screen.queryByRole("dialog", { name: "Play As You Like チュートリアル" }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe("true");
  });

  it("reopens tutorial from the help button after acknowledgement", () => {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    render(<HomePage />);

    expect(
      screen.queryByRole("dialog", { name: "Play As You Like チュートリアル" }),
    ).not.toBeInTheDocument();

    const helpButton = screen.getByRole("button", { name: "ヘルプ" });
    fireEvent.click(helpButton);

    expect(
      screen.getByRole("dialog", { name: "Play As You Like チュートリアル" }),
    ).toBeInTheDocument();
  });
});
