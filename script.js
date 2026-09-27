const STORAGE_KEY = 'monthly-notes-v1';

const state = {
  papers: [],
  activeId: null,
};

const pageListEl = document.getElementById('pageList');
const emptyStateEl = document.getElementById('emptyState');
const editorEl = document.getElementById('editor');
const pageTitleInput = document.getElementById('pageTitle');
const notesTextEl = document.getElementById('notesText');
const financeTableBody = document.getElementById('financeTableBody');
const addPageBtn = document.getElementById('addPageBtn');
const addRowBtn = document.getElementById('addRowBtn');
const deletePageBtn = document.getElementById('deletePageBtn');
const pageCountEl = document.getElementById('pageCount');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const transactionCountEl = document.getElementById('transactionCount');
const categoryCountEl = document.getElementById('categoryCount');
const averageTransactionEl = document.getElementById('averageTransaction');
const categorySummaryBody = document.getElementById('categorySummaryBody');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const categoryChartEl = document.getElementById('categoryChart');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const overviewIncomeEl = document.getElementById('overviewIncome');
const overviewExpenseEl = document.getElementById('overviewExpense');
const overviewBalanceEl = document.getElementById('overviewBalance');
const overviewTransactionsEl = document.getElementById('overviewTransactions');
const overviewPaperCountEl = document.getElementById('overviewPaperCount');
const monthlyTrendChartEl = document.getElementById('monthlyTrendChart');
const monthlyTrendComparisonEl = document.getElementById('monthlyTrendComparison');
const trendPeriodFilterEl = document.getElementById('trendPeriodFilter');
const themeToggle = document.getElementById('themeToggle');
const toastRegion = document.getElementById('toastRegion');
const confirmDialog = document.getElementById('confirmDialog');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const financeRowTemplate = document.getElementById('financeRowTemplate');
const transactionSearchEl = document.getElementById('transactionSearch');
const transactionDateFromEl = document.getElementById('transactionDateFrom');
const transactionDateToEl = document.getElementById('transactionDateTo');
const transactionTypeFilterEl = document.getElementById('transactionTypeFilter');
const paymentFilterEl = document.getElementById('paymentFilter');
const transactionSortEl = document.getElementById('transactionSort');
const openingBalanceEl = document.getElementById('openingBalance');
const budgetCategoryEl = document.getElementById('budgetCategory');
const budgetAmountEl = document.getElementById('budgetAmount');
const addBudgetBtn = document.getElementById('addBudgetBtn');
const budgetListEl = document.getElementById('budgetList');
const customCategoryEl = document.getElementById('customCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const customPaymentEl = document.getElementById('customPayment');
const addPaymentBtn = document.getElementById('addPaymentBtn');
const customOptionListEl = document.getElementById('customOptionList');
const categoryOptionsEl = document.getElementById('categoryOptions');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFileEl = document.getElementById('restoreFile');
let saveToastTimer;
const filters = { search: '', dateFrom: '', dateTo: '', type: 'all', payment: 'all', sort: 'newest' };
const defaultCategories = ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Gaji'];
const defaultPaymentMethods = ['Cash', 'Bank transfer', 'E-wallet', 'Kartu'];

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
  themeToggle.querySelector('.theme-label').textContent = isDark ? 'Mode terang' : 'Mode malam';
  themeToggle.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode malam');
  themeToggle.setAttribute('title', isDark ? 'Mode terang' : 'Mode malam');
}

function showToast(message, type = 'success', action = null) {
  const toast = document.createElement('div');
  const icon = document.createElement('span');
  toast.className = `toast ${type}`;
  icon.className = 'toast-icon';
  icon.textContent = type === 'success' ? '✓' : 'i';
  toast.append(icon, document.createTextNode(message));
  if (action) {
    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.className = 'toast-action';
    actionButton.textContent = action.label;
    actionButton.addEventListener('click', () => {
      action.onClick();
      toast.remove();
    });
    toast.appendChild(actionButton);
  }
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2400);
}

function showSavedToast() {
  window.clearTimeout(saveToastTimer);
  saveToastTimer = window.setTimeout(() => showToast('Perubahan tersimpan', 'success'), 450);
}

function closeConfirmDialog() {
  confirmDialog.classList.add('hidden');
}

function openConfirmDialog() {
  confirmDialog.classList.remove('hidden');
  confirmDeleteBtn.focus();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatCurrency(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number || 0);
}

function getMonthLabel(date = new Date()) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date(date);
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

function getNextMonthlyTitle() {
  const existing = state.papers.map((paper) => paper.title);
  const current = getMonthLabel();
  if (!existing.includes(current)) {
    return current;
  }

  const baseDate = new Date();
  let monthOffset = 1;
  let title = current;

  while (existing.includes(title)) {
    baseDate.setMonth(baseDate.getMonth() + monthOffset);
    title = getMonthLabel(baseDate);
    monthOffset += 1;
  }

  return title;
}

function createDefaultPaper() {
  return {
    id: generateId(),
    title: getNextMonthlyTitle(),
    notes: '',
    openingBalance: 0,
    budgets: {},
    customCategories: [...defaultCategories],
    customPayments: [...defaultPaymentMethods],
    transactions: [
      {
        id: generateId(),
        date: '',
        category: '',
        description: '',
        amount: 0,
        type: 'expense',
        paymentMethod: 'Cash',
      },
    ],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.papers));
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.papers = [];
    state.activeId = null;
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    state.papers = Array.isArray(parsed) ? parsed.map((paper) => ({
      ...paper,
      openingBalance: Number(paper.openingBalance || 0),
      budgets: paper.budgets && typeof paper.budgets === 'object' ? paper.budgets : {},
      customCategories: Array.isArray(paper.customCategories) ? [...new Set([...defaultCategories, ...paper.customCategories])] : [...defaultCategories],
      customPayments: Array.isArray(paper.customPayments) ? [...new Set([...defaultPaymentMethods, ...paper.customPayments])] : [...defaultPaymentMethods],
      transactions: Array.isArray(paper.transactions) ? paper.transactions.map((entry) => ({
        ...entry,
        paymentMethod: entry.paymentMethod || 'Cash',
      })) : [],
    })) : [];
    state.activeId = state.papers[0]?.id || null;
  } catch (error) {
    state.papers = [];
    state.activeId = null;
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function renderOverview() {
  const totals = state.papers.reduce((summary, paper) => {
    summary.income += paper.transactions.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    summary.expense += paper.transactions.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    summary.balance += Number(paper.openingBalance || 0);
    summary.transactions += paper.transactions.filter((entry) => Number(entry.amount || 0) > 0).length;
    return summary;
  }, { income: 0, expense: 0, balance: 0, transactions: 0 });

  totals.balance += totals.income - totals.expense;
  overviewIncomeEl.textContent = formatCurrency(totals.income);
  overviewExpenseEl.textContent = formatCurrency(totals.expense);
  overviewBalanceEl.textContent = formatCurrency(totals.balance);
  overviewTransactionsEl.textContent = totals.transactions;
  overviewPaperCountEl.textContent = `${state.papers.length} kertas`;
  renderMonthlyTrend();
}

function renderMonthlyTrend() {
  const monthlyTotals = new Map();
  const datedTransactions = [];
  state.papers.forEach((paper) => {
    paper.transactions.forEach((entry) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date || '')) return;
      const monthKey = entry.date.slice(0, 7);
      const totals = monthlyTotals.get(monthKey) || { income: 0, expense: 0 };
      totals[entry.type === 'income' ? 'income' : 'expense'] += Number(entry.amount || 0);
      monthlyTotals.set(monthKey, totals);
      datedTransactions.push(entry);
    });
  });

  monthlyTrendChartEl.innerHTML = '';
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
  const sumMonth = (month, type) => (monthlyTotals.get(month)?.[type] || 0);
  const currentIncome = sumMonth(currentMonth, 'income');
  const previousIncome = sumMonth(previousMonth, 'income');
  const currentExpense = sumMonth(currentMonth, 'expense');
  const previousExpense = sumMonth(previousMonth, 'expense');
  const differenceLabel = (current, previous) => `${current >= previous ? '+' : '-'}${formatCurrency(Math.abs(current - previous))}`;
  monthlyTrendComparisonEl.textContent = `Bulan ini vs bulan lalu: pemasukan ${differenceLabel(currentIncome, previousIncome)} (${formatCurrency(currentIncome)} vs ${formatCurrency(previousIncome)}), pengeluaran ${differenceLabel(currentExpense, previousExpense)} (${formatCurrency(currentExpense)} vs ${formatCurrency(previousExpense)}).`;

  if (!datedTransactions.length) {
    monthlyTrendChartEl.innerHTML = '<p class="chart-empty">Belum ada data bulanan.</p>';
    return;
  }

  const latestMonth = [...monthlyTotals.keys()].sort().at(-1);
  const range = Number(trendPeriodFilterEl.value || 6);
  const latestDate = new Date(`${latestMonth}-01T12:00:00`);
  const currentDate = new Date(`${currentMonth}-01T12:00:00`);
  const anchorDate = currentDate - latestDate <= range * 31 * 24 * 60 * 60 * 1000 ? currentDate : latestDate;
  const months = [];
  for (let offset = range - 1; offset >= 0; offset -= 1) {
    const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - offset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push([monthKey, monthlyTotals.get(monthKey) || { income: 0, expense: 0 }]);
  }
  const maxValue = Math.max(...months.flatMap(([, totals]) => [totals.income, totals.expense]), 1);
  months.forEach(([month, totals]) => {
    const group = document.createElement('div');
    const bars = document.createElement('div');
    const label = document.createElement('span');
    group.className = 'monthly-trend-group';
    bars.className = 'monthly-trend-bars';
    label.className = 'monthly-trend-label';
    const monthDate = new Date(`${month}-01T12:00:00`);
    label.textContent = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(monthDate);
    label.title = getMonthLabel(monthDate);
    [['income', totals.income], ['expense', totals.expense]].forEach(([type, value]) => {
      const bar = document.createElement('span');
      bar.className = `monthly-trend-bar ${type}-bar`;
      bar.style.height = `${Math.max((value / maxValue) * 100, value > 0 ? 4 : 0)}%`;
      bar.title = `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${formatCurrency(value)}`;
      bars.appendChild(bar);
    });
    group.append(bars, label);
    monthlyTrendChartEl.appendChild(group);
  });
}

function getActivePaper() {
  return state.papers.find((paper) => paper.id === state.activeId) || null;
}

function renderPageList() {
  pageListEl.innerHTML = '';
  pageCountEl.textContent = state.papers.length;

  if (!state.papers.length) {
    pageListEl.innerHTML = '<p class="page-item-meta">Belum ada kertas</p>';
    return;
  }

  state.papers.forEach((paper) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-item ${paper.id === state.activeId ? 'active' : ''}`;
    const title = document.createElement('span');
    const meta = document.createElement('span');
    title.className = 'page-item-title';
    meta.className = 'page-item-meta';
    title.textContent = paper.title;
    meta.textContent = `${paper.transactions.length} transaksi`;
    button.append(title, meta);
    button.addEventListener('click', () => {
      state.activeId = paper.id;
      render();
    });
    pageListEl.appendChild(button);
  });
}

function renderFinanceSummary() {
  const paper = getActivePaper();
  if (!paper) {
    totalIncomeEl.textContent = formatCurrency(0);
    totalExpenseEl.textContent = formatCurrency(0);
    netBalanceEl.textContent = formatCurrency(0);
    return;
  }

  const income = paper.transactions
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const expense = paper.transactions
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const balance = Number(paper.openingBalance || 0) + income - expense;

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  netBalanceEl.textContent = formatCurrency(balance);
}

function getCategorySummary(paper) {
  const categories = new Map();

  paper.transactions.forEach((entry) => {
    const category = entry.category.trim() || 'Tanpa kategori';
    const current = categories.get(category) || { income: 0, expense: 0, count: 0 };
    const amount = Number(entry.amount || 0);

    current[entry.type === 'income' ? 'income' : 'expense'] += amount;
    current.count += 1;
    categories.set(category, current);
  });

  return [...categories.entries()].sort((first, second) => {
    const firstTotal = first[1].income + first[1].expense;
    const secondTotal = second[1].income + second[1].expense;
    return secondTotal - firstTotal || first[0].localeCompare(second[0]);
  });
}

function renderBookkeepingSummary() {
  const paper = getActivePaper();
  categorySummaryBody.innerHTML = '';

  if (!paper) {
    transactionCountEl.textContent = '0';
    categoryCountEl.textContent = '0';
    averageTransactionEl.textContent = formatCurrency(0);
    return;
  }

  const entriesWithValue = paper.transactions.filter((entry) => Number(entry.amount || 0) > 0);
  const totalValue = entriesWithValue.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const categorySummary = getCategorySummary(paper);

  transactionCountEl.textContent = paper.transactions.length;
  categoryCountEl.textContent = categorySummary.length;
  averageTransactionEl.textContent = formatCurrency(entriesWithValue.length ? totalValue / entriesWithValue.length : 0);

  categorySummary.forEach(([category, summary]) => {
    const row = document.createElement('tr');
    const cells = [
      category,
      formatCurrency(summary.income),
      formatCurrency(summary.expense),
      formatCurrency(summary.income - summary.expense),
      summary.count,
    ];

    cells.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    categorySummaryBody.appendChild(row);
  });

  renderBudgetList(paper);

  renderCategoryChart(categorySummary);
}

function renderBudgetList(paper) {
  budgetListEl.innerHTML = '';
  const expenseByCategory = paper.transactions.reduce((totals, entry) => {
    const category = entry.category.trim() || 'Tanpa kategori';
    if (entry.type === 'expense') totals[category] = (totals[category] || 0) + Number(entry.amount || 0);
    return totals;
  }, {});

  Object.entries(paper.budgets || {}).forEach(([category, limit]) => {
    const spent = expenseByCategory[category] || 0;
    const numericLimit = Math.max(Number(limit), 1);
    const usage = (spent / numericLimit) * 100;
    const percentage = Math.min(usage, 100);
    const item = document.createElement('div');
    item.className = 'budget-item';
    const head = document.createElement('div');
    const name = document.createElement('strong');
    const remove = document.createElement('button');
    const progress = document.createElement('div');
    const progressBar = document.createElement('span');
    const meta = document.createElement('div');
    const spentLabel = document.createElement('span');
    const limitLabel = document.createElement('span');
    const status = document.createElement('span');
    head.className = 'budget-item-head';
    progress.className = 'budget-progress';
    meta.className = 'budget-item-meta';
    name.textContent = category;
    remove.type = 'button';
    remove.className = 'budget-remove';
    remove.dataset.budget = category;
    remove.textContent = '×';
    progressBar.style.width = `${percentage}%`;
    progressBar.className = usage >= 100 ? 'over-budget' : usage >= 80 ? 'near-budget' : '';
    spentLabel.textContent = `${formatCurrency(spent)} terpakai`;
    status.className = 'budget-status';
    status.textContent = usage >= 100 ? 'Melewati batas' : usage >= 80 ? 'Mendekati batas' : 'Aman';
    status.classList.add(usage >= 100 ? 'over-budget' : usage >= 80 ? 'near-budget' : 'safe-budget');
    limitLabel.textContent = `${formatCurrency(limit)} batas`;
    head.append(name, remove);
    progress.appendChild(progressBar);
    meta.append(spentLabel, limitLabel, status);
    item.append(head, progress, meta);
    budgetListEl.appendChild(item);
  });
}

function renderCustomOptions(paper) {
  categoryOptionsEl.innerHTML = '';
  paper.customCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    categoryOptionsEl.appendChild(option);
  });

  customOptionListEl.innerHTML = '';
  [['Kategori', paper.customCategories, 'category'], ['Akun', paper.customPayments, 'payment']].forEach(([label, values, type]) => {
    const group = document.createElement('div');
    group.className = 'custom-option-group';
    const heading = document.createElement('span');
    heading.textContent = `${label}:`;
    group.appendChild(heading);
    values.forEach((value) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'option-chip';
      chip.dataset.optionType = type;
      chip.dataset.optionValue = value;
      chip.textContent = `${value} ×`;
      group.appendChild(chip);
    });
    customOptionListEl.appendChild(group);
  });
}

function renderCategoryChart(categorySummary) {
  categoryChartEl.innerHTML = '';

  if (!categorySummary.length) {
    categoryChartEl.innerHTML = '<p class="chart-empty">Belum ada data untuk ditampilkan.</p>';
    return;
  }

  const maxValue = Math.max(...categorySummary.map(([, summary]) => Math.max(summary.income, summary.expense)), 1);

  categorySummary.forEach(([category, summary]) => {
    const group = document.createElement('div');
    const bars = document.createElement('div');
    const label = document.createElement('span');
    group.className = 'chart-group';
    bars.className = 'chart-bars';
    label.className = 'chart-label';
    label.textContent = category;
    label.title = category;

    [['income', summary.income], ['expense', summary.expense]].forEach(([type, value]) => {
      const bar = document.createElement('div');
      const valueLabel = document.createElement('span');
      bar.className = `chart-bar ${type}-bar`;
      bar.style.height = `${Math.max((value / maxValue) * 100, value > 0 ? 3 : 0)}%`;
      bar.title = `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${formatCurrency(value)}`;
      valueLabel.className = 'chart-value';
      valueLabel.textContent = value > 0 ? formatCurrency(value).replace('Rp ', 'Rp ') : '';
      bar.appendChild(valueLabel);
      bars.appendChild(bar);
    });

    group.appendChild(bars);
    group.appendChild(label);
    categoryChartEl.appendChild(group);
  });
}

function renderFinanceTable() {
  const paper = getActivePaper();
  financeTableBody.innerHTML = '';

  if (!paper) {
    return;
  }

  if (!paper.transactions.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7" style="color:#6f7582; text-align:center; padding:20px;">Belum ada data keuangan.</td>';
    financeTableBody.appendChild(emptyRow);
    return;
  }

  const visibleTransactions = paper.transactions.filter((entry) => {
    const haystack = `${entry.category} ${entry.description}`.toLowerCase();
    const matchesSearch = !filters.search || haystack.includes(filters.search);
    const matchesDateFrom = !filters.dateFrom || (entry.date && entry.date >= filters.dateFrom);
    const matchesDateTo = !filters.dateTo || (entry.date && entry.date <= filters.dateTo);
    const matchesType = filters.type === 'all' || entry.type === filters.type;
    const matchesPayment = filters.payment === 'all' || (entry.paymentMethod || 'Cash') === filters.payment;
    return matchesSearch && matchesDateFrom && matchesDateTo && matchesType && matchesPayment;
  }).sort((first, second) => {
    if (filters.sort === 'largest') return Number(second.amount || 0) - Number(first.amount || 0);
    const firstDate = first.date || '';
    const secondDate = second.date || '';
    return filters.sort === 'oldest' ? firstDate.localeCompare(secondDate) : secondDate.localeCompare(firstDate);
  });

  if (!visibleTransactions.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="7" style="color:#6f7582; text-align:center; padding:20px;">Tidak ada transaksi yang cocok.</td>';
    financeTableBody.appendChild(emptyRow);
    return;
  }

  visibleTransactions.forEach((entry) => {
    const row = financeRowTemplate.content.firstElementChild.cloneNode(true);
    const dateInput = row.querySelector('.date');
    const categoryInput = row.querySelector('.category');
    const descriptionInput = row.querySelector('.description');
    const amountInput = row.querySelector('.amount');
    const typeSelect = row.querySelector('.type');
    const paymentSelect = row.querySelector('.payment-method');
    const menuToggle = row.querySelector('.menu-toggle');
    const rowActions = row.querySelector('.row-actions');
    const duplicateBtn = row.querySelector('.duplicate');
    const recurringBtn = row.querySelector('.recurring');
    const deleteBtn = row.querySelector('.mini-btn.danger');

    dateInput.value = entry.date || '';
    categoryInput.value = entry.category || '';
    descriptionInput.value = entry.description || '';
    amountInput.value = entry.amount || 0;
    typeSelect.value = entry.type || 'expense';
    paymentSelect.innerHTML = '';
    paper.customPayments.forEach((payment) => {
      const option = document.createElement('option');
      option.value = payment;
      option.textContent = payment;
      paymentSelect.appendChild(option);
    });
    paymentSelect.value = entry.paymentMethod || 'Cash';

    menuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = rowActions.classList.contains('hidden');
      document.querySelectorAll('.row-actions').forEach((menu) => menu.classList.add('hidden'));
      document.querySelectorAll('.menu-toggle').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
      rowActions.classList.toggle('hidden', !willOpen);
      menuToggle.setAttribute('aria-expanded', String(willOpen));
    });

    dateInput.addEventListener('input', (event) => {
      entry.date = event.target.value;
      saveState();
      renderOverview();
      showSavedToast();
    });

    categoryInput.addEventListener('input', (event) => {
      entry.category = event.target.value;
      saveState();
      renderBookkeepingSummary();
      showSavedToast();
    });

    descriptionInput.addEventListener('input', (event) => {
      entry.description = event.target.value;
      saveState();
      showSavedToast();
    });

    amountInput.addEventListener('input', (event) => {
      entry.amount = Number(event.target.value || 0);
      saveState();
      renderOverview();
      renderFinanceSummary();
      renderBookkeepingSummary();
      showSavedToast();
    });

    typeSelect.addEventListener('change', (event) => {
      entry.type = event.target.value;
      saveState();
      renderOverview();
      renderFinanceSummary();
      renderBookkeepingSummary();
      showSavedToast();
    });

    paymentSelect.addEventListener('change', (event) => {
      entry.paymentMethod = event.target.value;
      saveState();
      showSavedToast();
    });

    duplicateBtn.addEventListener('click', () => {
      paper.transactions.push({ ...entry, id: generateId(), date: getToday() });
      saveState();
      render();
      showToast('Transaksi berhasil disalin', 'info');
    });

    recurringBtn.addEventListener('click', () => {
      const startDate = entry.date ? new Date(`${entry.date}T12:00:00`) : new Date();
      [1, 2, 3].forEach((monthOffset) => {
        const recurringDate = new Date(startDate);
        recurringDate.setMonth(recurringDate.getMonth() + monthOffset);
        paper.transactions.push({ ...entry, id: generateId(), date: recurringDate.toISOString().slice(0, 10) });
      });
      saveState();
      render();
      showToast('Transaksi dibuat untuk tiga bulan berikutnya');
    });

    deleteBtn.addEventListener('click', () => {
      const deletedIndex = paper.transactions.findIndex((item) => item.id === entry.id);
      paper.transactions = paper.transactions.filter((item) => item.id !== entry.id);
      if (!paper.transactions.length) {
        paper.transactions.push({
          id: generateId(),
          date: '',
          category: '',
          description: '',
          amount: 0,
          type: 'expense',
          paymentMethod: 'Cash',
        });
      }
      saveState();
      render();
      showToast('Transaksi dihapus', 'info', {
        label: 'Undo',
        onClick: () => {
          const currentPaper = state.papers.find((item) => item.id === paper.id);
          if (!currentPaper) return;
          const placeholder = currentPaper.transactions[0];
          if (currentPaper.transactions.length === 1 && placeholder && !placeholder.category && !placeholder.description && !placeholder.amount && !placeholder.date) {
            currentPaper.transactions = [];
          }
          currentPaper.transactions.splice(Math.min(deletedIndex, currentPaper.transactions.length), 0, entry);
          saveState();
          render();
          showToast('Transaksi dikembalikan');
        },
      });
    });

    financeTableBody.appendChild(row);
  });
}

function renderEditor() {
  const paper = getActivePaper();

  if (!paper) {
    editorEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
    return;
  }

  editorEl.classList.remove('hidden');
  emptyStateEl.classList.add('hidden');

  pageTitleInput.value = paper.title;
  notesTextEl.value = paper.notes;
  openingBalanceEl.value = paper.openingBalance || 0;

  renderFinanceSummary();
  renderBookkeepingSummary();
  renderCustomOptions(paper);
  renderFinanceTable();
}

function render() {
  renderOverview();
  renderPageList();
  renderEditor();
}

function addNewPaper() {
  const newPaper = createDefaultPaper();
  state.papers.unshift(newPaper);
  state.activeId = newPaper.id;
  saveState();
  render();
  showToast('Kertas baru berhasil dibuat');
}

function addFinanceRow() {
  const paper = getActivePaper();
  if (!paper) return;

  paper.transactions.push({
    id: generateId(),
    date: getToday(),
    category: '',
    description: '',
    amount: 0,
    type: 'expense',
    paymentMethod: 'Cash',
  });

  saveState();
  render();
  const newCategoryInput = financeTableBody.querySelector('.category:last-of-type');
  if (newCategoryInput) {
    newCategoryInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    newCategoryInput.focus();
  }
  showToast('Baris transaksi ditambahkan', 'info');
}

function deleteCurrentPaper() {
  if (!state.activeId) return;
  openConfirmDialog();
}

function confirmDeleteCurrentPaper() {
  if (!state.activeId) return;

  state.papers = state.papers.filter((paper) => paper.id !== state.activeId);
  state.activeId = state.papers[0]?.id || null;
  saveState();
  render();
  closeConfirmDialog();
  showToast('Kertas berhasil dihapus', 'info');
}

pageTitleInput.addEventListener('input', (event) => {
  const paper = getActivePaper();
  if (!paper) return;

  paper.title = event.target.value || 'Judul Catatan';
  saveState();
  renderPageList();
  showSavedToast();
});

notesTextEl.addEventListener('input', (event) => {
  const paper = getActivePaper();
  if (!paper) return;

  paper.notes = event.target.value;
  saveState();
  showSavedToast();
});

openingBalanceEl.addEventListener('input', (event) => {
  const paper = getActivePaper();
  if (!paper) return;

  paper.openingBalance = Number(event.target.value || 0);
  saveState();
  renderFinanceSummary();
  showSavedToast();
});

function applyFilters() {
  filters.search = transactionSearchEl.value.trim().toLowerCase();
  filters.dateFrom = transactionDateFromEl.value;
  filters.dateTo = transactionDateToEl.value;
  filters.type = transactionTypeFilterEl.value;
  filters.payment = paymentFilterEl.value;
  filters.sort = transactionSortEl.value;
  renderFinanceTable();
}

transactionSearchEl.addEventListener('input', applyFilters);
transactionDateFromEl.addEventListener('change', applyFilters);
transactionDateToEl.addEventListener('change', applyFilters);
transactionTypeFilterEl.addEventListener('change', applyFilters);
paymentFilterEl.addEventListener('change', applyFilters);
transactionSortEl.addEventListener('change', applyFilters);

function addCustomOption(type, input) {
  const paper = getActivePaper();
  const value = input.value.trim();
  const target = type === 'category' ? paper?.customCategories : paper?.customPayments;
  if (!paper || !value || target.includes(value)) {
    showToast('Isi nilai baru yang belum ada terlebih dahulu', 'info');
    return;
  }
  target.push(value);
  input.value = '';
  saveState();
  renderEditor();
  showToast(`${type === 'category' ? 'Kategori' : 'Akun'} ditambahkan`);
}

addCategoryBtn.addEventListener('click', () => addCustomOption('category', customCategoryEl));
addPaymentBtn.addEventListener('click', () => addCustomOption('payment', customPaymentEl));
customOptionListEl.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-option-type]');
  const paper = getActivePaper();
  if (!chip || !paper) return;
  const target = chip.dataset.optionType === 'category' ? paper.customCategories : paper.customPayments;
  if (target.length <= 1) return;
  target.splice(target.indexOf(chip.dataset.optionValue), 1);
  saveState();
  renderEditor();
});

addBudgetBtn.addEventListener('click', () => {
  const paper = getActivePaper();
  const category = budgetCategoryEl.value.trim();
  const amount = Number(budgetAmountEl.value || 0);
  if (!paper || !category || amount <= 0) {
    showToast('Isi kategori dan batas anggaran terlebih dahulu', 'info');
    return;
  }

  paper.budgets[category] = amount;
  budgetCategoryEl.value = '';
  budgetAmountEl.value = '';
  saveState();
  renderBookkeepingSummary();
  showToast('Anggaran kategori disimpan');
});

budgetListEl.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-budget]');
  const paper = getActivePaper();
  if (!removeButton || !paper) return;

  delete paper.budgets[removeButton.dataset.budget];
  saveState();
  renderBookkeepingSummary();
  showToast('Anggaran dihapus', 'info');
});

backupBtn.addEventListener('click', () => {
  const backup = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), papers: state.papers }, null, 2);
  const blob = new Blob([backup], { type: 'application/json;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast('Backup data siap diunduh');
});

restoreBtn.addEventListener('click', () => restoreFileEl.click());
restoreFileEl.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const imported = JSON.parse(reader.result);
      const papers = Array.isArray(imported) ? imported : imported.papers;
      if (!Array.isArray(papers)) throw new Error('Format backup tidak valid');
      if (!papers.every((paper) => paper && typeof paper === 'object' && Array.isArray(paper.transactions))) {
        throw new Error('Format backup tidak valid');
      }
      if (!window.confirm('Restore akan mengganti data Ledger saat ini. Lanjutkan?')) return;
      state.papers = papers.map((paper) => ({
        ...paper,
        id: paper.id || generateId(),
        title: String(paper.title || 'Judul Catatan'),
        notes: String(paper.notes || ''),
        openingBalance: Number(paper.openingBalance || 0),
        budgets: paper.budgets && typeof paper.budgets === 'object' ? paper.budgets : {},
        customCategories: Array.isArray(paper.customCategories) ? [...new Set([...defaultCategories, ...paper.customCategories])] : [...defaultCategories],
        customPayments: Array.isArray(paper.customPayments) ? [...new Set([...defaultPaymentMethods, ...paper.customPayments])] : [...defaultPaymentMethods],
      }));
      state.activeId = state.papers[0]?.id || null;
      saveState();
      render();
      showToast('Backup berhasil dipulihkan');
    } catch (error) {
      showToast('File backup tidak valid', 'info');
    }
    restoreFileEl.value = '';
  });
  reader.readAsText(file);
});

addPageBtn.addEventListener('click', addNewPaper);
addRowBtn.addEventListener('click', addFinanceRow);
deletePageBtn.addEventListener('click', deleteCurrentPaper);
confirmCancelBtn.addEventListener('click', closeConfirmDialog);
confirmDeleteBtn.addEventListener('click', confirmDeleteCurrentPaper);
confirmDialog.addEventListener('click', (event) => {
  if (event.target.matches('[data-confirm-cancel]')) closeConfirmDialog();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !confirmDialog.classList.contains('hidden')) closeConfirmDialog();
});
document.addEventListener('click', () => {
  document.querySelectorAll('.row-actions').forEach((menu) => menu.classList.add('hidden'));
  document.querySelectorAll('.menu-toggle').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function exportCurrentPaperToExcel() {
  const paper = getActivePaper();
  if (!paper) return;

  const rows = paper.transactions.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.date)}</td>
      <td>${escapeHtml(entry.category)}</td>
      <td>${escapeHtml(entry.description)}</td>
      <td>${Number(entry.amount || 0)}</td>
      <td>${entry.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
    </tr>`).join('');
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><style>td, th { border: 1px solid #d9e1ec; padding: 6px; } th { background: #eaf2ff; font-weight: bold; }</style></head>
      <body><table>
        <thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Nominal</th><th>Jenis</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></body>
    </html>`;
  const blob = new Blob([`\uFEFF${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (paper.title || 'ledger').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

  link.href = downloadUrl;
  link.download = `${safeTitle || 'ledger'}.xls`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

function exportCurrentPaperToCsv() {
  const paper = getActivePaper();
  if (!paper) return;

  const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Nominal', 'Jenis', 'Akun'];
  const rows = paper.transactions.map((entry) => [
    entry.date || '', entry.category || '', entry.description || '', Number(entry.amount || 0),
    entry.type === 'income' ? 'Pemasukan' : 'Pengeluaran', entry.paymentMethod || 'Cash',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${(paper.title || 'ledger').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'ledger'}.csv`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast('CSV berhasil diekspor');
}

exportExcelBtn.addEventListener('click', exportCurrentPaperToExcel);
exportCsvBtn.addEventListener('click', exportCurrentPaperToCsv);
trendPeriodFilterEl.addEventListener('change', renderMonthlyTrend);
themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
  localStorage.setItem('ledger-theme', nextTheme);
  applyTheme(nextTheme);
});

function init() {
  applyTheme(localStorage.getItem('ledger-theme') || 'dark');
  loadState();

  if (!state.papers.length) {
    const starter = createDefaultPaper();
    state.papers = [starter];
    state.activeId = starter.id;
    saveState();
  }

  render();
}

init();
