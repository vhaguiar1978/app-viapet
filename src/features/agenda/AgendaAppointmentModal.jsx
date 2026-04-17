import { useEffect, useMemo, useRef, useState } from "react";
import { EditableField, EditableSearchSelectField, EditableTextArea, SearchSelectInput } from "../../components/fields.jsx";

function WhatsappButtonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="agenda-inline-svg">
      <path
        fill="currentColor"
        d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.57 2 2.13 6.42 2.13 11.88c0 1.75.46 3.46 1.33 4.96L2 22l5.3-1.39a9.9 9.9 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.42 9.9-9.88a9.8 9.8 0 0 0-2.89-6.99ZM12.04 20.14h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.15.83.84-3.07-.2-.31a8.14 8.14 0 0 1-1.26-4.38c0-4.52 3.71-8.21 8.26-8.21 2.2 0 4.27.85 5.83 2.4a8.12 8.12 0 0 1 2.41 5.8c0 4.53-3.71 8.22-8.24 8.22Zm4.5-6.15c-.25-.12-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.3.19-.55.06-.25-.12-1.07-.39-2.03-1.24-.75-.66-1.25-1.47-1.4-1.72-.15-.24-.01-.37.11-.49.11-.11.25-.29.37-.44.12-.14.16-.24.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.33-.77-1.82-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.24-.87.85-.87 2.08s.89 2.42 1.01 2.59c.12.16 1.75 2.66 4.23 3.73.59.26 1.06.41 1.43.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.17.21-.58.21-1.07.15-1.17-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  );
}

function formatMoneyInput(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function buildCatalogOptions(services, products, itemRows = []) {
  const baseOptions = [
    ...services.map((service) => ({
      value: `service:${service.id}`,
      label: `Servico: ${service.name}`,
      searchText: `${service.name} ${service.category || ""} servico`,
    })),
    ...products.map((product) => ({
      value: `product:${product.id}`,
      label: `Produto: ${product.name}`,
      searchText: `${product.name} ${product.category || ""} ${product.barcode || product.barCode || ""} produto`,
    })),
  ];

  const fallbackOptions = (itemRows || [])
    .filter((row) => row.referenceId && row.description)
    .map((row) => ({
      value: `${row.kind}:${row.referenceId}`,
      label: `${row.kind === "product" ? "Produto" : "Servico"}: ${row.description}`,
      searchText: `${row.description} ${row.kind === "product" ? "produto" : "servico"}`,
    }))
    .filter(
      (fallback) => !baseOptions.some((option) => String(option.value) === String(fallback.value)),
    );

  return [...baseOptions, ...fallbackOptions];
}

function buildPackageCalendar(monthDate) {
  const baseDate = new Date(`${monthDate}T12:00:00`);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ empty: true, key: `empty-${index}` });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const value = new Date(year, month, day, 12).toISOString().slice(0, 10);
    cells.push({ key: value, day, value });
  }

  return {
    label: firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    cells,
  };
}

function buildPackageCalendars(startMonthDate, count = 12) {
  const baseDate = new Date(`${startMonthDate}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + index, 1, 12);
    return buildPackageCalendar(nextDate.toISOString().slice(0, 10));
  });
}

function resolvePackageMonthDate(sourceDate = "") {
  const normalized = String(sourceDate || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized.slice(0, 7)}-01`;
  }

  const fallback = new Date();
  return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-01`;
}

function shiftPackageMonthDate(monthDate, offset) {
  const baseDate = new Date(`${resolvePackageMonthDate(monthDate)}T12:00:00`);
  const shifted = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1, 12);
  return shifted.toISOString().slice(0, 10);
}

function formatPackageSelectedDate(date) {
  if (!date) return "";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

const packageMonthLabels = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Marco" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const paymentMethodOptions = ["Pix", "Pix pela maquina", "Dinheiro", "Debito", "Credito", "Credito parcelado", "Transferencia"];

function normalizeAgendaSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .toLowerCase()
    .trim();
}

function getPetCustomerIdLocal(pet = {}) {
  return String(pet.customerId || pet.custumerId || "").trim();
}

export function AgendaAppointmentModal({
  title = "Estetica",
  editor,
  customers,
  pets,
  services,
  products,
  responsibleOptions = [],
  onClose,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onPaymentChange,
  onAddPayment,
  onRemovePayment,
  onSave,
  onDelete,
}) {
  const [packagePickerOpen, setPackagePickerOpen] = useState(false);
  const [packagePickerMonth, setPackagePickerMonth] = useState(() =>
    resolvePackageMonthDate(editor?.form?.date),
  );
  const [petSearchOpen, setPetSearchOpen] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const petBlurTimeoutRef = useRef(null);
  const savePendingTimeoutRef = useRef(null);
  const catalogOptions = useMemo(
    () => buildCatalogOptions(services, products, editor.form.itemRows || []),
    [editor.form.itemRows, products, services],
  );
  const normalizedPetQuery = normalizeAgendaSearch(editor.form.petSearch);
  const petSuggestions = useMemo(() => {
    return pets
      .map((pet) => {
        const tutor = customers.find((customer) => String(customer.id) === getPetCustomerIdLocal(pet));
        const petName = String(pet.name || "");
        const tutorName = String(tutor?.name || "");
        const petNameSearch = normalizeAgendaSearch(petName);
        const tutorNameSearch = normalizeAgendaSearch(tutorName);
        const combinedSearch = normalizeAgendaSearch(`${petName} ${tutorName}`);

        let score = 999;
        if (!normalizedPetQuery) {
          score = 100;
        } else if (petNameSearch === normalizedPetQuery) {
          score = 0;
        } else if (petNameSearch.startsWith(normalizedPetQuery)) {
          score = 1;
        } else if (combinedSearch.startsWith(normalizedPetQuery)) {
          score = 2;
        } else if (petNameSearch.includes(normalizedPetQuery)) {
          score = 3;
        } else if (tutorNameSearch.startsWith(normalizedPetQuery)) {
          score = 4;
        } else if (combinedSearch.includes(normalizedPetQuery)) {
          score = 5;
        }

        return {
          pet,
          tutor,
          petName,
          tutorName,
          score,
        };
      })
      .filter((entry) => entry.score < 999)
      .sort((left, right) => {
        if (left.score !== right.score) return left.score - right.score;
        return left.petName.localeCompare(right.petName, "pt-BR");
      })
      .slice(0, 8);
  }, [customers, normalizedPetQuery, pets]);

  useEffect(
    () => () => {
      if (petBlurTimeoutRef.current) {
        clearTimeout(petBlurTimeoutRef.current);
      }
      if (savePendingTimeoutRef.current) {
        clearTimeout(savePendingTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (editor.saving || editor.feedback || editor.loading) {
      setSavePending(false);
    }
  }, [editor.feedback, editor.loading, editor.saving]);

  const totalAmount = (editor.form.itemRows || []).reduce(
    (sum, row) => sum + (Number(row.quantity || 0) || 0) * (Number(row.unitPrice || 0) || 0),
    0,
  );
  const paidAmount = (editor.form.paymentRows || []).reduce((sum, row) => {
    if (String(row.status || "").toLowerCase() !== "pago") return sum;
    if (!row.paymentMethod || row.amount === "") return sum;
    return sum + (Number(row.amount || 0) || 0);
  }, 0);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const overpaidAmount = Math.max(paidAmount - totalAmount, 0);
  const isFullyPaid = totalAmount > 0 && paidAmount > 0 && remainingAmount <= 0.009;
  const packageDates = Array.isArray(editor.form.packageDates) ? editor.form.packageDates : [];
  const packageSummary = editor.form.packageTotal > 1 ? `${editor.form.packageIndex || 1}/${editor.form.packageTotal}` : "";
  const selectedServiceId =
    editor.form.serviceId ||
    (editor.form.itemRows || []).find((row) => row.kind === "service" && row.referenceId)?.referenceId ||
    "";
  const canUsePackage = Boolean(selectedServiceId);
  const packageMonthDate = useMemo(() => {
    return resolvePackageMonthDate(editor.form.date || new Date().toISOString().slice(0, 10));
  }, [editor.form.date]);
  const packageCalendar = useMemo(() => buildPackageCalendar(packagePickerMonth || packageMonthDate), [packageMonthDate, packagePickerMonth]);
  const selectedPackageDates = useMemo(
    () =>
      [...packageDates]
        .filter(Boolean)
        .sort((left, right) => String(left).localeCompare(String(right)))
        .map((date) => ({
          value: date,
          label: formatPackageSelectedDate(date),
          isCurrent: String(date || "").slice(0, 10) === String(editor.form.date || "").slice(0, 10),
        })),
    [editor.form.date, packageDates],
  );
  const packageYearOptions = useMemo(() => {
    const referenceYears = [
      Number(String(packageMonthDate || "").slice(0, 4)) || new Date().getFullYear(),
      ...packageDates.map((date) => Number(String(date || "").slice(0, 4)) || 0),
    ].filter(Boolean);
    const minYear = Math.min(...referenceYears, new Date().getFullYear()) - 3;
    const maxYear = Math.max(...referenceYears, new Date().getFullYear()) + 3;
    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => String(minYear + index));
  }, [packageDates, packageMonthDate]);
  const packagePickerMonthValue = String(packagePickerMonth || packageMonthDate).slice(5, 7) || "01";
  const packagePickerYearValue = String(packagePickerMonth || packageMonthDate).slice(0, 4) || String(new Date().getFullYear());

  useEffect(() => {
    if (!packagePickerOpen) {
      setPackagePickerMonth(packageMonthDate);
    }
  }, [packageMonthDate, packagePickerOpen]);

  function togglePackageDate(date) {
    const nextDates = packageDates.includes(date)
      ? packageDates.filter((item) => item !== date)
      : [...packageDates, date];
    const normalized = [...new Set(nextDates)].sort((left, right) => String(left).localeCompare(String(right)));
    onFieldChange("packageDates", normalized);
    onFieldChange("packageGroupId", normalized.length > 1 ? editor.form.packageGroupId || `pkg-${Date.now()}` : "");
    onFieldChange("packageTotal", normalized.length > 1 ? normalized.length : 0);
    onFieldChange("packageIndex", normalized.length > 1 ? Math.max(normalized.indexOf(editor.form.date) + 1, 1) : 0);
  }

  function openPackagePicker() {
    if (!canUsePackage) return;
    if (!packageDates.length && editor.form.date) {
      onFieldChange("packageDates", [editor.form.date]);
    }
    setPackagePickerMonth(packageMonthDate);
    setPackagePickerOpen(true);
  }

  function clearPackageDates() {
    onFieldChange("packageDates", []);
    onFieldChange("packageGroupId", "");
    onFieldChange("packageTotal", 0);
    onFieldChange("packageIndex", 0);
  }

  function removePackageDate(dateToRemove) {
    if (!dateToRemove) return;
    const nextDates = packageDates.filter((item) => String(item || "").slice(0, 10) !== String(dateToRemove || "").slice(0, 10));
    const normalized = [...new Set(nextDates)].sort((left, right) => String(left).localeCompare(String(right)));
    onFieldChange("packageDates", normalized);
    onFieldChange("packageGroupId", normalized.length > 1 ? editor.form.packageGroupId || `pkg-${Date.now()}` : "");
    onFieldChange("packageTotal", normalized.length > 1 ? normalized.length : 0);
    onFieldChange(
      "packageIndex",
      normalized.length > 1 ? Math.max(normalized.indexOf(editor.form.date) + 1, 1) : 0,
    );
  }

  function updatePackagePickerMonth(partial) {
    const nextYear = partial.year || packagePickerYearValue;
    const nextMonth = partial.month || packagePickerMonthValue;
    setPackagePickerMonth(`${nextYear}-${nextMonth}-01`);
  }

  function handlePetSelection(petId) {
    if (petBlurTimeoutRef.current) {
      clearTimeout(petBlurTimeoutRef.current);
      petBlurTimeoutRef.current = null;
    }
    onFieldChange("petId", String(petId));
    setPetSearchOpen(false);
  }

  function handleSaveClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (editor.saving || editor.loading) return;
    setSavePending(true);
    if (savePendingTimeoutRef.current) {
      clearTimeout(savePendingTimeoutRef.current);
    }
    savePendingTimeoutRef.current = setTimeout(() => {
      setSavePending(false);
    }, 1500);
    onSave?.();
  }

  function requestItemRemoval(row) {
    if (!row?.id) return;
    setDeleteConfirm({
      type: "item",
      id: row.id,
      title: "Excluir item",
      message: `Deseja mesmo excluir ${row.description || "este item"} do lancamento?`,
    });
  }

  function requestPaymentRemoval(row) {
    if (!row?.id) return;
    setDeleteConfirm({
      type: "payment",
      id: row.id,
      title: "Excluir pagamento",
      message: "Deseja mesmo excluir esta linha de pagamento?",
    });
  }

  function requestAppointmentDeletion() {
    if (!editor.appointmentId) return;
    setDeleteConfirm({
      type: "appointment",
      id: editor.appointmentId,
      title: "Excluir agendamento",
      message: "Deseja excluir o agendamento atual?",
    });
  }

  function closeDeleteConfirm() {
    setDeleteConfirm(null);
  }

  function confirmDelete() {
    if (!deleteConfirm?.id) return;
    if (deleteConfirm.type === "appointment") {
      onDelete?.();
    } else if (deleteConfirm.type === "payment") {
      onRemovePayment?.(deleteConfirm.id);
    } else {
      onRemoveItem?.(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  }

  return (
    <div className="agenda-editor-overlay">
      <section className="modal-card agenda-editor-card agenda-legacy-editor-card">
        <div className="agenda-legacy-editor-scroll">
          <div className="agenda-legacy-title-row">
            <div className="agenda-legacy-title-icon">E</div>
            <div>
              <h2>{title}</h2>
            </div>
            <button type="button" className="agenda-legacy-top-close" onClick={onClose}>
              ×
            </button>
          </div>

          {editor.loading ? <div className="timeline-loading">Carregando cadastro...</div> : null}

          <div className="agenda-legacy-time-grid">
            <EditableField label="Data" type="date" value={editor.form.date} onChange={(value) => onFieldChange("date", value)} />
            <EditableField label="Hora" type="time" value={editor.form.time} onChange={(value) => onFieldChange("time", value)} />
            <EditableField label="Ate" type="time" value={editor.form.endTime || ""} onChange={(value) => onFieldChange("endTime", value)} />
          </div>

          <div className="agenda-legacy-main-grid">
            <EditableSearchSelectField
              label="Evento"
              value={selectedServiceId}
              onChange={(value) => onFieldChange("serviceId", value)}
              options={services.map((service) => ({
                value: String(service.id),
                label: service.name,
                searchText: `${service.name} ${service.category || ""}`,
              }))}
              placeholder="Digite o nome do evento"
            />

            <div className="field-block agenda-pet-search-block">
              <label>Pet</label>
              <input
                className="cell-input agenda-pet-search-input"
                type="text"
                value={editor.form.petSearch || ""}
                onChange={(event) => {
                  onFieldChange("petSearch", event.target.value);
                  setPetSearchOpen(true);
                }}
                onFocus={() => {
                  if (editor.form.petSearch) {
                    setPetSearchOpen(true);
                  }
                }}
                onBlur={() => {
                  petBlurTimeoutRef.current = setTimeout(() => {
                    setPetSearchOpen(false);
                  }, 120);
                }}
                placeholder="Digite o nome do pet"
              />
              {editor.form.petSearch && petSearchOpen ? (
                <div className="agenda-pet-search-list">
                  {petSuggestions.length ? (
                    petSuggestions.map(({ pet, tutor }) => {
                      return (
                        <button
                          key={pet.id}
                          type="button"
                          className="agenda-pet-search-item"
                          onPointerDown={(event) => event.preventDefault()}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handlePetSelection(pet.id)}
                        >
                          <strong>{pet.name}</strong>
                          <span>{tutor?.name || "Tutor nao informado"}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="agenda-pet-search-empty">Nenhum pet encontrado.</div>
                  )}
                </div>
              ) : null}
            </div>

            <EditableField label="Peso" value={editor.form.weight || ""} onChange={(value) => onFieldChange("weight", value)} />
            <EditableSearchSelectField
              label="Responsavel"
              value={editor.form.responsibleId || ""}
              onChange={(value) => onFieldChange("responsibleId", value)}
              options={responsibleOptions}
              placeholder="Selecione o responsavel"
            />
          </div>

          <EditableTextArea
            label="Descricao"
            value={editor.form.observation}
            onChange={(value) => onFieldChange("observation", value)}
            clearOnFocusValues={["Sem observacoes", "Sem observações"]}
          />

          <div className="section-chip sale">Venda</div>
          <div className="table-head sale-grid sale-grid-legacy">
            <div>Qtde</div>
            <div>Produto ou Servico</div>
            <div>Unitario</div>
            <div>Valor Total</div>
            <div />
          </div>
          <div className="table-body sale-table-body">
            {(editor.form.itemRows || []).map((row) => (
              <div key={row.id} className="table-row sale-grid sale-grid-legacy table-row-editor agenda-legacy-row">
                <div className="cell cell-editor">
                  <input
                    className="cell-input"
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(event) => onItemChange(row.id, "quantity", event.target.value)}
                  />
                </div>
                <div className="cell cell-editor cell-editor-search">
                  <SearchSelectInput
                    value={row.referenceId ? `${row.kind}:${row.referenceId}` : ""}
                    onChange={(value) => onItemChange(row.id, "referenceId", value)}
                    options={catalogOptions}
                    placeholder="Digite para buscar"
                    inputClassName="cell-input"
                    containerClassName="agenda-inline-search"
                    listClassName="field-search-list"
                    itemClassName="field-search-item"
                    emptyClassName="field-search-empty"
                  />
                </div>
                <div className="cell cell-editor">
                  <input
                    className="cell-input"
                    type="number"
                    value={row.unitPrice}
                    onChange={(event) => onItemChange(row.id, "unitPrice", event.target.value)}
                  />
                </div>
                <div className="cell cell-editor">
                  <input className="cell-input" type="text" value={formatMoneyInput(row.total)} readOnly />
                </div>
                <div className="cell cell-delete">
                  <button type="button" className="agenda-legacy-clear-btn" onClick={() => requestItemRemoval(row)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="agenda-legacy-add-row" onClick={onAddItem}>
              + Item...
            </button>
          </div>

          <div className="section-chip pay">Pagamento</div>
          <div className="table-head pay-grid pay-grid-legacy">
            <div>Vencimento</div>
            <div>Meio de Pagamento</div>
            <div>Dados</div>
            <div>Valor cheio</div>
            <div>Liquido</div>
            <div />
          </div>
            <div className="table-body pay-table-body">
              {(editor.form.paymentRows || []).map((row) => (
                <div key={row.id} className="table-row pay-grid pay-grid-legacy table-row-editor agenda-legacy-row">
                <div className="cell cell-editor">
                  <input
                    className="cell-input"
                    type="date"
                    value={row.dueDate}
                    onChange={(event) => onPaymentChange(row.id, "dueDate", event.target.value)}
                  />
                </div>
                <div className="cell cell-editor">
                  <select
                    className="cell-input"
                    value={row.paymentMethod}
                    onChange={(event) => onPaymentChange(row.id, "paymentMethod", event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cell cell-editor">
                  <input
                    className="cell-input"
                    type="text"
                    value={row.details || ""}
                    onChange={(event) => onPaymentChange(row.id, "details", event.target.value)}
                  />
                </div>
                <div className="cell cell-editor">
                  <input
                    className="cell-input"
                    type="number"
                    value={row.amount}
                    onChange={(event) => onPaymentChange(row.id, "amount", event.target.value)}
                  />
                </div>
                <div className="cell cell-editor">
                  <input className="cell-input agenda-net-input" type="text" value={formatMoneyInput(row.netAmount || 0)} readOnly />
                </div>
                <div className="cell cell-delete">
                  <button type="button" className="agenda-legacy-clear-btn" onClick={() => requestPaymentRemoval(row)}>
                    ×
                  </button>
                </div>
              </div>
            ))}

              <button type="button" className="agenda-legacy-add-row" onClick={onAddPayment}>
                + Pagamento
              </button>
            </div>
            <div className="agenda-payment-summary">
              {isFullyPaid ? (
                <div className="agenda-payment-summary-item agenda-payment-summary-item-paid">
                  <span>Pagamento</span>
                  <strong>✓ Pago</strong>
                </div>
              ) : null}
              <div className="agenda-payment-summary-item">
                <span>Total</span>
                <strong>R${formatMoneyInput(totalAmount)}</strong>
              </div>
              <div className="agenda-payment-summary-item">
                <span>Pago</span>
                <strong>R${formatMoneyInput(paidAmount)}</strong>
              </div>
              <div className="agenda-payment-summary-item">
                <span>Falta pagar</span>
                <strong>R${formatMoneyInput(remainingAmount)}</strong>
              </div>
              {overpaidAmount > 0 ? (
                <div className="agenda-payment-summary-item agenda-payment-summary-item-warning">
                  <span>Excedente</span>
                  <strong>R${formatMoneyInput(overpaidAmount)}</strong>
                </div>
              ) : null}
            </div>

            {editor.feedback ? <div className="registers-feedback">{editor.feedback}</div> : null}
          </div>

          <div className="agenda-legacy-footer">
            <div className="agenda-legacy-total">Total: R${formatMoneyInput(totalAmount)}</div>
            <div className="agenda-legacy-footer-actions">
              {canUsePackage ? (
                <button type="button" className="agenda-package-btn" onClick={openPackagePicker}>
                  <span className="agenda-package-btn-icon">▦</span>
                  <span>Pacote{packageDates.length > 1 ? ` (${packageDates.length})` : ""}</span>
                </button>
              ) : null}
              {editor.appointmentId ? (
                <button
                  type="button"
                  className="footer-btn footer-btn-icon footer-btn-danger"
                  onClick={requestAppointmentDeletion}
                  disabled={editor.saving}
                  aria-label="Excluir cadastro"
                >
                  🗑
                </button>
              ) : null}
              <button type="button" className="footer-btn patient-cancel-btn" onClick={onClose}>
                Cancelar
              </button>
            <button type="button" className="agenda-legacy-whatsapp-btn" aria-label="WhatsApp">
              <WhatsappButtonIcon />
            </button>
            <button
              className="footer-btn footer-btn-green"
              type="button"
              onMouseDown={handleSaveClick}
              onClick={handleSaveClick}
              disabled={editor.saving || editor.loading}
            >
              {editor.saving ? "Salvando..." : savePending ? "Processando..." : "Salvar"}
            </button>
          </div>
        </div>

        {packagePickerOpen ? (
          <div className="agenda-package-overlay">
            <section className="agenda-package-modal">
              <div className="customer-history-head">
                <div>
                  <span className="section-kicker">Pacote</span>
                  <h2>Selecionar datas do pacote</h2>
                  <p>As datas selecionadas serao lancadas automaticamente com o mesmo servico.</p>
                </div>
                <button type="button" className="agenda-legacy-top-close" onClick={() => setPackagePickerOpen(false)}>
                  ×
                </button>
              </div>

              <div className="agenda-package-layout">
                <section className="agenda-package-month-card">
                  <div className="agenda-package-nav">
                    <button
                      type="button"
                      className="agenda-package-nav-btn"
                      onClick={() => setPackagePickerMonth((current) => shiftPackageMonthDate(current || packageMonthDate, -1))}
                      aria-label="Mes anterior"
                    >
                      ‹
                    </button>
                    <div className="agenda-package-month">{packageCalendar.label}</div>
                    <button
                      type="button"
                      className="agenda-package-nav-btn"
                      onClick={() => setPackagePickerMonth((current) => shiftPackageMonthDate(current || packageMonthDate, 1))}
                      aria-label="Proximo mes"
                    >
                      ›
                    </button>
                  </div>
                  <div className="agenda-package-jump">
                    <label>
                      <span>Mes</span>
                      <select
                        value={packagePickerMonthValue}
                        onChange={(event) => updatePackagePickerMonth({ month: event.target.value })}
                      >
                        {packageMonthLabels.map((monthOption) => (
                          <option key={monthOption.value} value={monthOption.value}>
                            {monthOption.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Ano</span>
                      <select
                        value={packagePickerYearValue}
                        onChange={(event) => updatePackagePickerMonth({ year: event.target.value })}
                      >
                        {packageYearOptions.map((yearOption) => (
                          <option key={yearOption} value={yearOption}>
                            {yearOption}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="agenda-package-weekdays">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                      <span key={`${packageCalendar.label}-${day}`}>{day}</span>
                    ))}
                  </div>
                  <div className="agenda-package-grid">
                    {packageCalendar.cells.map((cell) =>
                      cell.empty ? (
                        <span key={cell.key} className="agenda-package-day agenda-package-day-empty" />
                      ) : (
                        <button
                          key={cell.key}
                          type="button"
                          className={[
                            "agenda-package-day",
                            packageDates.includes(cell.value) ? "active" : "",
                            String(cell.value || "").slice(0, 10) === String(editor.form.date || "").slice(0, 10)
                              ? "agenda-package-day-current"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => togglePackageDate(cell.value)}
                        >
                          {cell.day}
                        </button>
                      ),
                    )}
                  </div>
                </section>

                <section className="agenda-package-selected-panel">
                  <div className="agenda-package-selected-badge">Datas Selecionadas: {selectedPackageDates.length}</div>
                  {selectedPackageDates.length ? (
                    <ul className="agenda-package-selected-list">
                      {selectedPackageDates.map((item) => (
                        <li key={item.value} className="agenda-package-selected-item">
                          <span>{item.label}</span>
                          {item.isCurrent ? (
                            <strong>Data principal</strong>
                          ) : (
                            <button
                              type="button"
                              className="agenda-package-remove-btn"
                              onClick={() => removePackageDate(item.value)}
                              aria-label={`Excluir a data ${item.label}`}
                            >
                              Excluir
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="agenda-package-empty-state">Escolha as datas do pacote no calendario ao lado.</p>
                  )}
                </section>
              </div>

              <div className="agenda-package-selected">
                <strong>{packageDates.length}</strong>
                <span>datas selecionadas</span>
              </div>

              <div className="agenda-package-actions">
                <button type="button" className="ghost-btn" onClick={clearPackageDates}>
                  Limpar
                </button>
                <button type="button" className="footer-btn footer-btn-green" onClick={() => setPackagePickerOpen(false)}>
                  Concluir
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {deleteConfirm ? (
          <div className="user-modal-overlay">
            <div className="confirm-modal">
              <h3>{deleteConfirm.title}</h3>
              <p>{deleteConfirm.message}</p>
              <div className="confirm-modal-actions">
                <button type="button" className="footer-btn patient-cancel-btn" onClick={closeDeleteConfirm}>
                  Cancelar
                </button>
                <button type="button" className="footer-btn footer-btn-green" onClick={confirmDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
