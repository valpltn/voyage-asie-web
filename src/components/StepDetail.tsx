import { formatDateRange } from "../lib/format";
import type { TripStep } from "../lib/types";
import { EditButton } from "./EditButton";

export function StepDetail({ onEdit, step }: { onEdit?: () => void; step: TripStep }) {
  return (
    <div className="editable-region">
      {onEdit && <EditButton label={`Modifier ${step.label}`} onClick={onEdit} />}
      <div className="step-kicker">
        <span className="dot" style={{ background: step.color }} />
        {step.region}
      </div>
      <h2>{step.label}</h2>
      <p className="detail-meta">
        {formatDateRange(step.startDate, step.endDate)} - {step.nights}
        <br />
        {step.transport}
      </p>
      <div className="detail-section">
        <h3>Temps forts</h3>
        <div className="chips">
          {step.highlights.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="detail-section">
        <h3>Mini planning</h3>
        <ul>
          {step.dailyPlan.map((item) => (
            <li key={`${step.id}-${item.date}`}>
              <strong>{item.date}</strong> - {item.summary}
            </li>
          ))}
        </ul>
      </div>
      {step.mapPoints && step.mapPoints.length > 0 && (
        <div className="detail-section">
          <h3>Inter-étapes sur la carte</h3>
          <div className="map-point-list">
            {step.mapPoints.map((point, index) => (
              <div className="map-point-item" key={point.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{point.label}</strong>
                  <small>{point.date}</small>
                  <p>{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {step.activities && step.activities.length > 0 && (
        <div className="detail-section">
          <h3>Activités week-end</h3>
          <div className="activity-list">
            {step.activities.map((activity) => (
              <a className="activity-item" href={activity.sourceUrl} key={activity.title} rel="noreferrer" target="_blank">
                <strong>{activity.title}</strong>
                <span>{activity.description}</span>
                <em>{activity.sourceLabel}</em>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
