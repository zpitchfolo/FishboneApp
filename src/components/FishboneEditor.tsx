import React from 'react';
import type { Category, Cause, FishboneData } from '../types/fishbone';
import { Plus, Trash2, X, ChevronRight } from 'lucide-react';

interface FishboneEditorProps {
  data: FishboneData;
  onChange: (data: FishboneData) => void;
}

// ---- Recursive Cause Item ----
const CauseItem: React.FC<{
  cause: Cause;
  onUpdate: (updates: Partial<Cause>) => void;
  onRemove: () => void;
  onAddSubCause: () => void;
  level: number;
}> = ({ cause, onUpdate, onRemove, onAddSubCause, level }) => {
  return (
    <div className="cause-row-wrap animate-in">
      <div className="cause-row">
        {level > 0 && <ChevronRight size={10} className="cause-chevron" />}
        <input
          type="text"
          className="cause-input"
          value={cause.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Describe cause…"
        />
        <div className="cause-actions">
          <button className="btn-icon" title="Add detail" onClick={onAddSubCause}>
            <Plus size={11} />
          </button>
          <button className="btn-icon danger" title="Remove" onClick={onRemove}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {cause.subCauses && cause.subCauses.length > 0 && (
        <div className="cause-sub-list">
          {cause.subCauses.map((sub, idx) => (
            <CauseItem
              key={sub.id}
              cause={sub}
              level={level + 1}
              onUpdate={(updates) => {
                const next = [...cause.subCauses!];
                next[idx] = { ...next[idx], ...updates };
                onUpdate({ subCauses: next });
              }}
              onRemove={() => onUpdate({ subCauses: cause.subCauses!.filter((_, i) => i !== idx) })}
              onAddSubCause={() => {
                const newSub: Cause = { id: Math.random().toString(36).substr(2, 9), text: '', subCauses: [] };
                onUpdate({ subCauses: [...(cause.subCauses || []), newSub] });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---- Main Editor ----
const FishboneEditor: React.FC<FishboneEditorProps> = ({ data, onChange }) => {
  const updateCategory = (id: string, updates: Partial<Category>) =>
    onChange({ ...data, categories: data.categories.map(c => c.id === id ? { ...c, ...updates } : c) });

  const removeCategory = (id: string) =>
    onChange({ ...data, categories: data.categories.filter(c => c.id !== id) });

  const addCategory = () => {
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      causes: []
    };
    onChange({ ...data, categories: [...data.categories, newCat] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Problem Statement */}
      <div>
        <label className="form-label">Problem Statement</label>
        <input
          type="text"
          className="form-input"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="What is the main problem?"
        />
      </div>

      <div className="divider" />

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label className="form-label">Cause Categories (Bones)</label>

        {data.categories.map((cat) => (
          <div key={cat.id} className="category-card animate-in">
            {/* Category Header */}
            <div className="category-header">
              <div className="category-dot" />
              <input
                type="text"
                className="category-name-input"
                value={cat.name}
                onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                placeholder="Category name…"
              />
              <button className="btn-icon danger" onClick={() => removeCategory(cat.id)} title="Remove category">
                <X size={13} />
              </button>
            </div>

            {/* Causes */}
            <div className="cause-list">
              {(cat.causes || []).map((cause, idx) => (
                <CauseItem
                  key={cause.id}
                  cause={cause}
                  level={0}
                  onUpdate={(updates) => {
                    const next = [...cat.causes];
                    next[idx] = { ...next[idx], ...updates };
                    updateCategory(cat.id, { causes: next });
                  }}
                  onRemove={() => updateCategory(cat.id, { causes: cat.causes.filter((_, i) => i !== idx) })}
                  onAddSubCause={() => {
                    const newSub: Cause = { id: Math.random().toString(36).substr(2, 9), text: '', subCauses: [] };
                    const next = [...cat.causes];
                    next[idx] = { ...next[idx], subCauses: [...(next[idx].subCauses || []), newSub] };
                    updateCategory(cat.id, { causes: next });
                  }}
                />
              ))}
              <button
                className="add-cause-btn"
                onClick={() => {
                  const newCause: Cause = { id: Math.random().toString(36).substr(2, 9), text: '', subCauses: [] };
                  updateCategory(cat.id, { causes: [...cat.causes, newCause] });
                }}
              >
                <Plus size={10} /> Add Cause
              </button>
            </div>
          </div>
        ))}

        <button className="add-bone-btn" onClick={addCategory}>
          <Plus size={13} /> Add Bone
        </button>
      </div>
    </div>
  );
};

export default FishboneEditor;
