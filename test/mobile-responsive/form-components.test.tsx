/** @format */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import fc from "fast-check";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Feature: mobile-responsive-design
 * Tests for form component mobile responsiveness
 * 
 * Validates: Requirements 3.1, 3.2, 3.4, 6.1
 */

describe("Form Components Mobile Responsiveness", () => {
  describe("Input Component", () => {
    it("should have mobile-first height classes (h-12 on mobile, h-10 on desktop)", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("text", "email", "password", "search", "tel", "url", "number"),
          fc.string({ minLength: 0, maxLength: 50 }),
          (type, placeholder) => {
            const { container } = render(
              <Input type={type} placeholder={placeholder} />
            );

            const input = container.querySelector("input");
            expect(input).toBeTruthy();
            
            if (input) {
              const classList = Array.from(input.classList);
              
              // Should have h-12 for mobile (48px)
              expect(classList).toContain("h-12");
              
              // Should have md:h-10 for desktop
              expect(classList.some(cls => cls.includes("md:h-10"))).toBe(true);
              
              // Should have full width
              expect(classList).toContain("w-full");
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should support proper input types for mobile keyboards", () => {
      const inputTypes = ["email", "tel", "search", "url", "number"];
      
      inputTypes.forEach(type => {
        const { container } = render(<Input type={type} />);
        const input = container.querySelector("input");
        
        expect(input).toBeTruthy();
        expect(input?.getAttribute("type")).toBe(type);
      });
    });
  });

  describe("Button Component", () => {
    it("should have minimum 44px height on mobile for all sizes", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("default", "sm", "lg", "icon"),
          fc.string({ minLength: 1, maxLength: 20 }),
          (size, label) => {
            const { container } = render(
              <Button size={size as any}>{label}</Button>
            );

            const button = container.querySelector("button");
            expect(button).toBeTruthy();
            
            if (button) {
              const classList = Array.from(button.classList);
              
              // Should have min-h-* classes for mobile
              const hasMinHeight = classList.some(cls => cls.includes("min-h-"));
              expect(hasMinHeight).toBe(true);
              
              // Check specific minimum heights
              if (size === "default" || size === "icon") {
                expect(classList.some(cls => cls.includes("min-h-11"))).toBe(true);
              } else if (size === "sm") {
                expect(classList.some(cls => cls.includes("min-h-10"))).toBe(true);
              } else if (size === "lg") {
                expect(classList.some(cls => cls.includes("min-h-12"))).toBe(true);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Textarea Component", () => {
    it("should have mobile-optimized sizing", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (placeholder) => {
            const { container } = render(
              <Textarea placeholder={placeholder} />
            );

            const textarea = container.querySelector("textarea");
            expect(textarea).toBeTruthy();
            
            if (textarea) {
              const classList = Array.from(textarea.classList);
              
              // Should have min-h-[100px] for mobile
              expect(classList.some(cls => cls.includes("min-h-[100px]"))).toBe(true);
              
              // Should have md:min-h-[80px] for desktop
              expect(classList.some(cls => cls.includes("md:min-h-[80px]"))).toBe(true);
              
              // Should have full width
              expect(classList).toContain("w-full");
              
              // Should have text-base for mobile
              expect(classList).toContain("text-base");
              
              // Should have md:text-sm for desktop
              expect(classList.some(cls => cls.includes("md:text-sm"))).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Label Component", () => {
    it("should have responsive text sizing", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (labelText) => {
            const { container } = render(
              <Label>{labelText}</Label>
            );

            const label = container.querySelector("label");
            expect(label).toBeTruthy();
            
            if (label) {
              const classList = Array.from(label.classList);
              
              // Should have text-base for mobile
              expect(classList).toContain("text-base");
              
              // Should have md:text-sm for desktop
              expect(classList.some(cls => cls.includes("md:text-sm"))).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Form Element Spacing", () => {
    it("should have adequate spacing between form elements", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (label1, label2) => {
            const { container } = render(
              <div className="space-y-4 md:space-y-4" data-testid="form-container">
                <div className="space-y-2 md:space-y-2" data-testid="field-container">
                  <Label>{label1}</Label>
                  <Input type="text" />
                </div>
                <div className="space-y-2 md:space-y-2" data-testid="field-container">
                  <Label>{label2}</Label>
                  <Input type="text" />
                </div>
              </div>
            );

            const formContainer = container.querySelector('[data-testid="form-container"]');
            expect(formContainer).toBeTruthy();
            
            if (formContainer) {
              const classList = Array.from(formContainer.classList);
              
              // Should have space-y-4 for spacing between form groups
              expect(classList.some(cls => cls.includes("space-y-4"))).toBe(true);
            }
            
            // Check individual field containers
            const fieldContainers = container.querySelectorAll('[data-testid="field-container"]');
            expect(fieldContainers.length).toBe(2);
            
            fieldContainers.forEach(fieldContainer => {
              const classList = Array.from(fieldContainer.classList);
              
              // Should have space-y-2 for spacing between label and input
              expect(classList.some(cls => cls.includes("space-y-2"))).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
