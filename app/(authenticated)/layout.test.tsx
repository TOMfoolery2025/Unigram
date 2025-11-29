/** @format */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import AuthenticatedLayout from "./layout";

// Mock the navigation components
vi.mock("@/components/navigation", () => ({
  MainNav: () => <aside data-testid="main-nav">MainNav</aside>,
  MobileBottomNav: () => <nav data-testid="mobile-nav">MobileBottomNav</nav>,
}));

// Mock the auth hook
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "test-user", email: "test@example.com" } }),
}));

describe("AuthenticatedLayout", () => {
  it("should render without errors", () => {
    const { container } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    expect(container).toBeTruthy();
  });

  it("should render both navigation components", () => {
    const { getByTestId } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    expect(getByTestId("main-nav")).toBeTruthy();
    expect(getByTestId("mobile-nav")).toBeTruthy();
  });

  it("should have responsive margin-left classes (ml-0 lg:ml-72)", () => {
    const { container } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("ml-0");
    expect(main?.className).toContain("lg:ml-72");
  });

  it("should have responsive padding classes (p-4 md:p-6 lg:p-8)", () => {
    const { container } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("p-4");
    expect(main?.className).toContain("md:p-6");
    expect(main?.className).toContain("lg:p-8");
  });

  it("should have bottom padding for mobile navigation clearance (pb-20 on mobile, pb-8 on desktop)", () => {
    const { container } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("pb-20");
    expect(main?.className).toContain("md:pb-20");
    expect(main?.className).toContain("lg:pb-8");
  });

  it("should render children content", () => {
    const { getByText } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    expect(getByText("Test Content")).toBeTruthy();
  });

  it("should have flex-1 and overflow-y-auto for scrollable content", () => {
    const { container } = render(
      <AuthenticatedLayout>
        <div>Test Content</div>
      </AuthenticatedLayout>
    );
    
    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("flex-1");
    expect(main?.className).toContain("overflow-y-auto");
  });
});
