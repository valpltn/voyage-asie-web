import { Pencil } from "lucide-react";

export function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button aria-label={label} className="icon-btn edit-btn" onClick={onClick} title={label} type="button">
      <Pencil aria-hidden="true" size={16} />
    </button>
  );
}
