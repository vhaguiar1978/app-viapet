// Facade que re-exporta as views financeiras a partir de seus arquivos
// individuais em ./views/, para que o bundler gere um chunk por view e
// código antigo que importava de "FinancePages.jsx" continue funcionando.

export { FinanceSalesView } from "./views/FinanceSalesView.jsx";
export { FinancePurchasesView } from "./views/FinancePurchasesView.jsx";
export { FinancePersonalExpensesView } from "./views/FinancePersonalExpensesView.jsx";
export { FinanceEmployeesView } from "./views/FinanceEmployeesView.jsx";
export { FinanceFreelanceView } from "./views/FinanceFreelanceView.jsx";
export { FinanceFixedExpensesView } from "./views/FinanceFixedExpensesView.jsx";
export { FinancePaymentsView } from "./views/FinancePaymentsView.jsx";
export { FinanceCommissionsView } from "./views/FinanceCommissionsView.jsx";
export { FinanceSummaryView, FinanceDemonstrativoSection } from "./views/FinanceSummaryView.jsx";
export { FinanceTaxasView } from "./views/FinanceTaxasView.jsx";
export { FinanceContasView } from "./views/FinanceContasView.jsx";
export { FinanceConciliacaoView } from "./views/FinanceConciliacaoView.jsx";
export { FinanceParcelasModal } from "./views/FinanceParcelasModal.jsx";
