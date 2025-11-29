/** @format */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageUploadInput } from "./image-upload-input";

describe("ImageUploadInput", () => {
  it("should render the upload area", () => {
    const mockOnChange = vi.fn();
    render(<ImageUploadInput value={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText(/Click to upload or drag and drop/i)).toBeDefined();
  });

  it("should display file type and size requirements", () => {
    const mockOnChange = vi.fn();
    render(<ImageUploadInput value={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText(/JPEG, PNG, GIF, or WebP/i)).toBeDefined();
    expect(screen.getByText(/max 5MB/i)).toBeDefined();
  });

  it("should accept file input element", () => {
    const mockOnChange = vi.fn();
    render(<ImageUploadInput value={[]} onChange={mockOnChange} />);
    
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeDefined();
    expect(input?.getAttribute("accept")).toContain("image/jpeg");
    expect(input?.getAttribute("accept")).toContain("image/png");
    expect(input?.getAttribute("accept")).toContain("image/gif");
    expect(input?.getAttribute("accept")).toContain("image/webp");
  });
});
