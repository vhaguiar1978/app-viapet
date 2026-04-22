import { useEffect, useMemo, useRef, useState } from "react";

function toFieldToken(value = "", fallback = "field") {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function useFieldIdentity(label = "", fallback = "field") {
  const stableSuffixRef = useRef(Math.random().toString(36).slice(2, 8));
  const name = useMemo(() => toFieldToken(label, fallback), [label, fallback]);
  const id = useMemo(() => `${name}-${stableSuffixRef.current}`, [name]);
  return { id, name };
}

export function Field({ label, value }) {
  const { id } = useFieldIdentity(label, "field");
  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <div id={id} className="input-like">{value}</div>
    </div>
  );
}

export function EditableField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  onBlur,
  onFocus,
  maxLength,
  inputMode,
  clearOnFocusValues = [],
}) {
  const normalizedClearValues = clearOnFocusValues
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter(Boolean);
  const { id, name } = useFieldIdentity(label, "field");

  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        className="field-input"
        type={type}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={(event) => {
          if (normalizedClearValues.includes(String(value ?? "").trim().toLowerCase())) {
            onChange("");
          }
          onFocus?.(event);
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
      />
    </div>
  );
}

export function EditableSuggestField({ label, value, onChange, options = [], placeholder = "" }) {
  const { id, name } = useFieldIdentity(label, "field");
  const listSuffixRef = useRef(Math.random().toString(36).slice(2, 8));
  const listId = useMemo(() => `suggest-${toFieldToken(label, "field")}-${listSuffixRef.current}`, [label]);

  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        className="field-input"
        type="text"
        aria-label={label}
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
  inputId = "",
  inputName = "",
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
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    const baseOptions = normalizedQuery
      ? normalizedOptions.filter((option) => {
          const optionText = normalizeSearchText(`${option.label} ${option.searchText}`);
          return optionText.includes(normalizedQuery);
        })
      : normalizedOptions;
    return baseOptions.slice(0, maxOptions);
  }, [maxOptions, normalizedOptions, query]);

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

  function resolveTypedOption(inputValue) {
    const trimmedQuery = String(inputValue || "").trim();
    if (!trimmedQuery) {
      return null;
    }

    const normalizedInput = normalizeSearchText(trimmedQuery);
    const matchingOptions = normalizedOptions.filter((option) => {
      const optionText = normalizeSearchText(`${option.label} ${option.searchText}`);
      return optionText.includes(normalizedInput);
    });
    const exactMatch = normalizedOptions.find(
      (option) => normalizeSearchText(option.label) === normalizedInput,
    );

    if (exactMatch) {
      return exactMatch;
    }

    return matchingOptions[0] || null;
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

      const matchedOption = resolveTypedOption(trimmedQuery);

      if (matchedOption) {
        onChange(String(matchedOption.value));
        setQuery(matchedOption.label);
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
        id={inputId || undefined}
        name={inputName || undefined}
        className={inputClassName}
        type="text"
        aria-label={placeholder || "Selecao"}
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setIsOpen(true);
          const matchedOption = resolveTypedOption(nextValue);

          if (!nextValue.trim()) {
            if (value) {
              onChange("");
            }
            return;
          }

          if (matchedOption) {
            onChange(String(matchedOption.value));
          } else if (value) {
            onChange("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const matchedOption = resolveTypedOption(query);
            if (matchedOption) {
              event.preventDefault();
              selectOption(matchedOption);
            }
          }
        }}
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
                onPointerDown={(event) => event.preventDefault()}
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
  const { id, name } = useFieldIdentity(label, "field");
  return (
    <div className="field-block field-search-block">
      <label htmlFor={id}>{label}</label>
      <SearchSelectInput
        inputId={id}
        inputName={name}
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
  const { id, name } = useFieldIdentity(label, "field");
  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <select id={id} name={name} className="field-input" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
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

export function EditableTextArea({ label, value, onChange, placeholder = "", onFocus, clearOnFocusValues = [] }) {
  const normalizedClearValues = clearOnFocusValues
    .map((item) => String(item ?? "").trim().toLowerCase())
    .filter(Boolean);
  const { id, name } = useFieldIdentity(label, "field");

  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name={name}
        className="field-textarea"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => {
          if (normalizedClearValues.includes(String(value ?? "").trim().toLowerCase())) {
            onChange("");
          }
          onFocus?.(event);
        }}
        placeholder={placeholder}
      />
    </div>
  );
}

export function EditableSuggestTextArea({ label, value, onChange, options = [], placeholder = "" }) {
  const visibleOptions = options.filter(Boolean).slice(0, 8);
  const { id, name } = useFieldIdentity(label, "field");

  return (
    <div className="field-block" data-field-label={label}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name={name}
        className="field-textarea"
        aria-label={label}
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
