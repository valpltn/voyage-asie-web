import { formatDateRange } from "../lib/format";
import type { TripStep } from "../lib/types";
import { EditButton } from "./EditButton";
import { EmptyState } from "./EmptyState";

export function RouteTimeline({
  onEditStep,
  onManageSteps,
  steps,
}: {
  onEditStep?: (stepId: string) => void;
  onManageSteps?: () => void;
  steps: TripStep[];
}) {
  if (steps.length === 0) {
    return (
      <section className="view active">
        <div className="view-actions">
          {onManageSteps && (
            <button className="plain-btn" onClick={onManageSteps} type="button">
              Gerer les etapes
            </button>
          )}
        </div>
        <EmptyState title="Aucun parcours" copy="Ce voyage n'a pas encore de planning jour par jour." />
      </section>
    );
  }

  return (
    <section className="view active">
      <div className="view-actions">
        {onManageSteps && (
          <button className="plain-btn" onClick={onManageSteps} type="button">
            Gerer les etapes
          </button>
        )}
      </div>
      <div className="timeline-grid">
        {steps.map((step) => (
          <article className="timeline-card editable-region" key={step.id}>
            {onEditStep && <EditButton label={`Modifier ${step.label}`} onClick={() => onEditStep(step.id)} />}
            <h2>{step.label}</h2>
            <p>
              {formatDateRange(step.startDate, step.endDate)} - {step.nights}
              <br />
              {step.transport}
            </p>
            <div className="timeline-days">
              {step.dailyPlan.map((item) => (
                <div className="day-row" key={`${step.id}-${item.date}`}>
                  <strong>{item.date}</strong>
                  <span>{item.summary}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
