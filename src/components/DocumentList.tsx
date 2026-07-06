import type { DocumentLink } from "../lib/types";
import { EditButton } from "./EditButton";
import { EmptyState } from "./EmptyState";

export function DocumentList({ documents, onEdit }: { documents: DocumentLink[]; onEdit?: () => void }) {
  if (documents.length === 0) {
    return <EmptyState title="Aucun document" copy="Relie ici les itineraires, checklists et notes utiles au voyage." />;
  }

  return (
    <section className="view active">
      {onEdit && (
        <div className="view-actions">
          <EditButton label="Modifier les documents" onClick={onEdit} />
        </div>
      )}
      <div className="document-grid">
        {documents.map((document) => (
          <article className="document-card" key={document.id}>
            <span>{document.type}</span>
            <h2>{document.title}</h2>
            <p>Visibilite: {document.visibility}</p>
            <a href={document.path} rel="noreferrer" target="_blank">
              Ouvrir le document
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
