"use client";

import type { ComponentType } from "react";
import { copy } from "@/copy";
import { CheckCircleIcon } from "@/components/icons";
import type { IconProps } from "@/components/icons";

export interface WizardStep {
  value: string;
  label: string;
  icon: ComponentType<IconProps>;
}

/**
 * Step indicator: display-only until the profile is complete, then
 * each step becomes a jump target (the current slice saves first, so
 * hopping never loses edits). Every step carries its own icon; the
 * active pill and the finished (teal) state keep their meaning.
 */
export default function StepIndicator({
  steps,
  current,
  navigable,
  onSelect,
}: {
  steps: WizardStep[];
  current: number;
  navigable: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label={`${copy.profile.stepLabel} ${current + 1} ${copy.profile.ofLabel} ${steps.length}`}>
      <ol className="stepper">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const StepIcon = done && !active ? CheckCircleIcon : step.icon;
          const inner = (
            <>
              <span className="stepper-icon" aria-hidden="true">
                <StepIcon size={16} />
              </span>
              <span className="truncate">{step.label}</span>
            </>
          );
          return (
            <li
              key={step.value}
              aria-current={active ? "step" : undefined}
              className={`stepper-item ${active ? "stepper-item-active" : ""} ${done ? "stepper-item-done" : ""}`}
            >
              {navigable && !active ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className="flex min-w-0 flex-1 items-center justify-center gap-2"
                  aria-label={`${copy.profile.stepLabel} ${step.label}`}
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
