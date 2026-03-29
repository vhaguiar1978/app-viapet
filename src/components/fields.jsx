export function Field({ label, value }) {
  return (
    <div className="field-block">
      <label>{label}</label>
      <div className="input-like">{value}</div>
    </div>
  );
}

export function EditableField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="field-block">
      <label>{label}</label>
      <input
        className="field-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function EditableSuggestField({ label, value, onChange, options = [], placeholder = "" }) {
  const listId = `suggest-${String(label || "field")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="field-block">
      <label>{label}</label>
      <input
        className="field-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

export function EditableSelectField({ label, value, onChange, options, placeholder = "Selecione" }) {
  return (
    <div className="field-block">
      <label>{label}</label>
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const normalized = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function EditableTextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <div className="field-block">
      <label>{label}</label>
      <textarea
        className="field-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function EditableSuggestTextArea({ label, value, onChange, options = [], placeholder = "" }) {
  const visibleOptions = options.filter(Boolean).slice(0, 8);

  return (
    <div className="field-block">
      <label>{label}</label>
      <textarea
        className="field-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {visibleOptions.length ? (
        <div className="field-suggestion-chips">
          {visibleOptions.map((option) => (
            <button key={option} type="button" className="field-suggestion-chip" onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
