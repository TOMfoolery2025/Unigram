/** @format */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JoinedSubhivesList } from "./joined-subhives-list";
import { SubforumWithMembership } from "@/types/forum";

describe("JoinedSubhivesList", () => {
  const mockSubhives: SubforumWithMembership[] = [
    {
      id: "1",
      name: "Test Subhive 1",
      description: "Description 1",
      member_count: 10,
      creator_id: "user1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_member: true,
    },
    {
      id: "2",
      name: "Test Subhive 2",
      description: "Description 2",
      member_count: 20,
      creator_id: "user2",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_member: true,
    },
  ];

  it("renders loading state", () => {
    render(
      <JoinedSubhivesList
        subhives={[]}
        onSelectSubhive={vi.fn()}
        isLoading={true}
      />
    );
    
    // Should show skeleton loaders
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders empty state when no subhives", () => {
    render(
      <JoinedSubhivesList
        subhives={[]}
        onSelectSubhive={vi.fn()}
        isLoading={false}
      />
    );
    
    expect(screen.getByText("No Subhives Joined")).toBeTruthy();
    expect(screen.getByText(/Discover and join subhives/)).toBeTruthy();
  });

  it("renders all joined subhives", () => {
    render(
      <JoinedSubhivesList
        subhives={mockSubhives}
        onSelectSubhive={vi.fn()}
        isLoading={false}
      />
    );
    
    expect(screen.getByText("Test Subhive 1")).toBeTruthy();
    expect(screen.getByText("Test Subhive 2")).toBeTruthy();
    expect(screen.getByText("All Hives")).toBeTruthy();
  });

  it("highlights selected subhive", () => {
    render(
      <JoinedSubhivesList
        subhives={mockSubhives}
        selectedSubhiveId="1"
        onSelectSubhive={vi.fn()}
        isLoading={false}
      />
    );
    
    const selectedButton = screen.getByText("Test Subhive 1").closest("button");
    expect(selectedButton?.className).toContain("bg-primary");
  });

  it("calls onSelectSubhive when clicking a subhive", () => {
    const onSelectSubhive = vi.fn();
    render(
      <JoinedSubhivesList
        subhives={mockSubhives}
        onSelectSubhive={onSelectSubhive}
        isLoading={false}
      />
    );
    
    fireEvent.click(screen.getByText("Test Subhive 1"));
    expect(onSelectSubhive).toHaveBeenCalledWith("1");
  });

  it("calls onSelectSubhive with null when clicking All Hives", () => {
    const onSelectSubhive = vi.fn();
    render(
      <JoinedSubhivesList
        subhives={mockSubhives}
        onSelectSubhive={onSelectSubhive}
        isLoading={false}
      />
    );
    
    fireEvent.click(screen.getByText("All Hives"));
    expect(onSelectSubhive).toHaveBeenCalledWith(null);
  });

  it("displays member count for each subhive", () => {
    render(
      <JoinedSubhivesList
        subhives={mockSubhives}
        onSelectSubhive={vi.fn()}
        isLoading={false}
      />
    );
    
    expect(screen.getByText("10 members")).toBeTruthy();
    expect(screen.getByText("20 members")).toBeTruthy();
  });
});
