import { useEffect, useMemo, useRef, useState } from "react";

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

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeSelectOption(option) {
  if (typeof option === "string") {
    return {
      value: option,
      label: option,
      searchText: option,
    };
  }

  return {
    value: String(option?.value ?? option?.label ?? ""),
    label: String(option?.label ?? option?.value ?? ""),
    searchText: String(option?.searchText ?? option?.label ?? option?.value ?? ""),
  };
}

export function SearchSelectInput({
  value,
  onChange,
  options = [],
  placeholder = "",
  emptyLabel = "Nenhum resultado encontrado.",
  inputClassName = "field-input",
  containerClassName = "",
  listClassName = "field-search-list",
  itemClassName = "field-search-item",
  emptyClassName = "field-search-empty",
  maxOptions = 8,
}) {
  const blurTimeoutRef = useRef(null);
  const normalizedOptions = useMemo(
    () => options.map(normalizeSelectOption).filter((option) => option.value && option.label),
    [options],
  );
  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)) || null,
    [normalizedOptions, value],
  );
  const selectedLabel = selectedOption?.label || "";
  const [query, setQuery] = useState(selectedOption?.label || "");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = normalizeSearchText(query);
  const filteredOptions = useMemo(() => {
    const baseOptions = normalizedQuery
      ? normalizedOptions.filter((option) => {
          const optionText = normalizeSearchText(`${option.label} ${option.searchText}`);
          return optionText.includes(normalizedQuery);
        })
      : normalizedOptions;
    return baseOptions.slice(0, maxOptions);
  }, [maxOptions, normalizedOptions, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedLabel);
    }
  }, [isOpen, selectedLabel, value]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    },
    [],
  );

  function selectOption(option) {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    onChange(String(option.value));
    setQuery(option.label);
    setIsOpen(false);
  }

  function handleBlur() {
    blurTimeoutRef.current = setTimeout(() => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        if (value) {
          onChange("");
        }
        setQuery("");
        setIsOpen(false);
        return;
      }

      const exactMatch = normalizedOptions.find(
        (option) => normalizeSearchText(option.label) === normalizeSearchText(trimmedQuery),
      );

      if (exactMatch) {
        onChange(String(exactMatch.value));
        setQuery(exactMatch.label);
      } else if (selectedOption) {
        setQuery(selectedOption.label);
      } else {
        setQuery("");
      }

      setIsOpen(false);
    }, 120);
  }

  return (
    <div className={`field-search ${containerClassName}`.trim()}>
      <input
        className={inputClassName}
        type="text"
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setIsOpen(true);
          if (!nextValue.trim() && value) {
            onChange("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen ? (
        <div className={listClassName}>
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={itemClassName}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <strong>{option.label}</strong>
              </button>
            ))
          ) : (
            <div className={emptyClassName}>{emptyLabel}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function EditableSearchSelectField({ label, value, onChange, options = [], placeholder = "", emptyLabel }) {
  return (
    <div className="field-block field-search-block">
      <label>{label}</label>
      <SearchSelectInput
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyLabel={emptyLabel}
      />
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
