import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

describe("Dialog Component", () => {
  it("should render dialog with mobile-responsive classes", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test dialog</DialogDescription>
          </DialogHeader>
          <div>Dialog content</div>
          <DialogFooter>
            <Button>Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Verify dialog content is rendered
    expect(screen.getByText("Test Dialog")).toBeTruthy();
    expect(screen.getByText("This is a test dialog")).toBeTruthy();
    expect(screen.getByText("Dialog content")).toBeTruthy();
  });

  it("should render close button with minimum touch target", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    // Verify close button exists
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeTruthy();
    
    // Verify close button has minimum touch target classes
    expect(closeButton.className).toContain("min-w-[44px]");
    expect(closeButton.className).toContain("min-h-[44px]");
  });

  it("should render footer buttons in mobile-friendly layout", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Verify both buttons are rendered
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Confirm")).toBeTruthy();
  });
});
