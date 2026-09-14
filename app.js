// Memuat library animasi Confetti
const confettiScript = document.createElement('script');
confettiScript.src = 'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js';
document.head.appendChild(confettiScript);

let jsConfetti;
confettiScript.onload = () => { jsConfetti = new JSConfetti(); };

let notes = JSON.parse(localStorage.getItem('catatku_notes')) || JSON.parse(localStorage.getItem('pwa_combined_notes')) || [];
let activeNoteId = null;
let currentMode = null; // 'text' atau 'finance'

// View Containers
const homeDashboardView = document.getElementById('home-dashboard-view');
const workspaceView = document.getElementById('workspace-view');

// Dashboard Cards
const cardOpenText = document.getElementById('card-open-text');
const cardOpenFinance = document.getElementById('card-open-finance');

// Sidebar & Overlay Elements
const sidebarTitle = document.getElementById('sidebar-title');
const btnSidebarAdd = document.getElementById('btn-sidebar-add');
const notesList = document.getElementById('notes-list');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');

// View Editor
const textEditorView = document.getElementById('text-editor-view');
const financeEditorView = document.getElementById('finance-editor-view');

// Text Form
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const charCount = document.getElementById('char-count');
const noteDate = document.getElementById('note-date');

// Finance Form
const financeTitle = document.getElementById('finance-title');
const transDesc = document.getElementById('trans-desc');
const transAmount = document.getElementById('trans-amount');
const transType = document.getElementById('trans-type');
const transListBody = document.getElementById('trans-list-body');

// Receipt Display
const receiptTitleDisplay = document.getElementById('receipt-title-display');
const receiptDateDisplay = document.getElementById('receipt-date-display');
const receiptItemsList = document.getElementById('receipt-items-list');
const receiptTotalIn = document.getElementById('receipt-total-in');
const receiptTotalOut = document.getElementById('receipt-total-out');
const receiptBalance = document.getElementById('receipt-balance');

// Buttons Toolbar
const btnGoHome = document.getElementById('btn-go-home');
const btnAddTrans = document.getElementById('btn-add-trans');
const btnExportReceipt = document.getElementById('btn-export-receipt');
const btnExportTxt = document.getElementById('btn-export-txt');
const btnDelete = document.getElementById('btn-delete');
const searchInput = document.getElementById('search-input');
const btnToggleTheme = document.getElementById('btn-toggle-theme');

// Modal Elements
const customModal = document.getElementById('custom-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const btnModalConfirm = document.getElementById('btn-modal-confirm');
const btnModalCancel = document.getElementById('btn-modal-cancel');

// HELPER UNTUK MEMBUKA/MENUTUP SIDEBAR DI HP (iOS Fix)
function openSidebar() {
  sidebar.classList.add('open');
  if (window.innerWidth <= 768) {
    sidebarOverlay.classList.add('active');
  }
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

function toggleSidebar() {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

btnToggleSidebar.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// LOGIKA THEMA / MODE MALAM
const savedTheme = localStorage.getItem('catatku_theme') || localStorage.getItem('pwa_theme') || 'light';
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  if (btnToggleTheme) btnToggleTheme.textContent = '☀️ Mode Terang';
}

if (btnToggleTheme) {
  btnToggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('catatku_theme', isDark ? 'dark' : 'light');
    btnToggleTheme.textContent = isDark ? '☀️ Mode Terang' : '🌙 Mode Malam';
  });
}

// SYSTEM MODAL KUSTOM
function showCustomAlert(message, title = 'Pemberitahuan', icon = '⚠️') {
  return new Promise((resolve) => {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    btnModalCancel.style.display = 'none';
    btnModalConfirm.textContent = 'OK';
    btnModalConfirm.className = 'btn btn-primary';
    customModal.style.display = 'flex';

    btnModalConfirm.onclick = () => {
      customModal.style.display = 'none';
      resolve(true);
    };
  });
}

function showCustomConfirm(message, title = 'Konfirmasi Aksinya', icon = '❓') {
  return new Promise((resolve) => {
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    btnModalCancel.style.display = 'inline-flex';
    btnModalConfirm.textContent = 'Ya, Lanjutkan';
    btnModalConfirm.className = 'btn btn-danger';
    customModal.style.display = 'flex';

    btnModalConfirm.onclick = () => {
      customModal.style.display = 'none';
      resolve(true);
    };

    btnModalCancel.onclick = () => {
      customModal.style.display = 'none';
      resolve(false);
    };
  });
}

// LOGIKA NAVIGASI
cardOpenText.addEventListener('click', () => openMode('text'));
cardOpenFinance.addEventListener('click', () => openMode('finance'));
btnGoHome.addEventListener('click', showHomeDashboard);

function showHomeDashboard() {
  closeSidebar();
  homeDashboardView.style.display = 'flex';
  workspaceView.style.display = 'none';
  currentMode = null;
  activeNoteId = null;
}

function openMode(mode) {
  closeSidebar();
  currentMode = mode;
  homeDashboardView.style.display = 'none';
  workspaceView.style.display = 'flex';

  if (mode === 'text') {
    sidebarTitle.textContent = 'Catatan Teks';
    btnSidebarAdd.textContent = '+ Catatan Baru';
    btnSidebarAdd.className = 'btn btn-primary';
  } else {
    sidebarTitle.textContent = 'Catatan Keuangan';
    btnSidebarAdd.textContent = '+ Laporan Baru';
    btnSidebarAdd.className = 'btn btn-success';
  }

  const filtered = notes.filter(n => n.type === mode);
  if (filtered.length > 0) {
    activeNoteId = filtered[0].id;
  } else {
    createNewNote(mode);
  }

  renderSidebar();
  loadActiveNote();
}

function createNewNote(type) {
  const newNote = {
    id: Date.now().toString(),
    type: type,
    title: type === 'finance' ? '💸 Catatan Kas' : '',
    content: '',
    items: [],
    updatedAt: new Date().toISOString()
  };
  notes.unshift(newNote);
  activeNoteId = newNote.id;
  saveToStorage();
  renderSidebar();
  loadActiveNote();

  if (jsConfetti) {
    jsConfetti.addConfetti({ emojis: ['✨', '🎈', '🎉'], confettiNumber: 15 });
  }
}

btnSidebarAdd.addEventListener('click', () => {
  if (currentMode) createNewNote(currentMode);
});

function renderSidebar(filter = '') {
  notesList.innerHTML = '';
  const filtered = notes.filter(n => n.type === currentMode && n.title.toLowerCase().includes(filter.toLowerCase()));

  filtered.forEach(note => {
    const li = document.createElement('li');
    li.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
    li.onclick = () => selectNote(note.id);

    li.innerHTML = `
      <div class="note-item-title">${note.title || 'Tanpa Judul'}</div>
      <div class="note-item-type">
        <span>${new Date(note.updatedAt).toLocaleDateString('id-ID')}</span>
      </div>
    `;
    notesList.appendChild(li);
  });
}

function selectNote(id) {
  activeNoteId = id;
  renderSidebar(searchInput.value);
  loadActiveNote();
  closeSidebar(); // Menutup sidebar setelah catatan dipilih di iOS/Android
}

function loadActiveNote() {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  if (note.type === 'text') {
    textEditorView.style.display = 'flex';
    financeEditorView.style.display = 'none';
    btnExportTxt.style.display = 'inline-flex';

    noteTitle.value = note.title;
    noteContent.value = note.content;
    noteDate.textContent = `Diubah: ${new Date(note.updatedAt).toLocaleString('id-ID')}`;
    updateStats();
  } else {
    textEditorView.style.display = 'none';
    financeEditorView.style.display = 'flex';
    btnExportTxt.style.display = 'none';

    financeTitle.value = note.title;
    renderFinanceTableAndReceipt();
  }
}

function saveToStorage() {
  localStorage.setItem('catatku_notes', JSON.stringify(notes));
}

// HANDLER CATATAN TEKS
noteTitle.addEventListener('input', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (note) { note.title = noteTitle.value; note.updatedAt = new Date().toISOString(); saveToStorage(); renderSidebar(searchInput.value); }
});

noteContent.addEventListener('input', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (note) { note.content = noteContent.value; note.updatedAt = new Date().toISOString(); saveToStorage(); updateStats(); }
});

function updateStats() {
  const text = noteContent.value.trim();
  charCount.textContent = `${noteContent.value.length} Karakter | ${text ? text.split(/\s+/).length : 0} Kata`;
}

// HANDLER TRANSAKSI KEUANGAN
btnAddTrans.addEventListener('click', async () => {
  const note = notes.find(n => n.id === activeNoteId);
  const desc = transDesc.value.trim();
  const rawAmount = transAmount.value.replace(/[^0-9.]/g, '');
  const amount = parseFloat(rawAmount);

  if (!desc || isNaN(amount) || amount <= 0) {
    await showCustomAlert('Mohon isi deskripsi dan jumlah nominal dengan benar!', 'Input Tidak Valid', '⚠️');
    return;
  }

  const now = new Date();
  const timeString = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

  note.items.push({ 
    id: Date.now(), 
    desc, 
    amount, 
    type: transType.value,
    createdAt: timeString
  });
  
  note.updatedAt = new Date().toISOString();
  saveToStorage();

  transDesc.value = '';
  transAmount.value = '';
  renderFinanceTableAndReceipt();

  if (jsConfetti) {
    jsConfetti.addConfetti({
      emojis: transType.value === 'in' ? ['💵', '🤑', '✨'] : ['🛒', '💸'],
      confettiNumber: 10
    });
  }
});

function deleteTransItem(itemId) {
  const note = notes.find(n => n.id === activeNoteId);
  note.items = note.items.filter(item => item.id !== itemId);
  note.updatedAt = new Date().toISOString();
  saveToStorage();
  renderFinanceTableAndReceipt();
}

function renderFinanceTableAndReceipt() {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note || note.type !== 'finance') return;

  transListBody.innerHTML = '';
  receiptItemsList.innerHTML = '';

  let totalIn = 0;
  let totalOut = 0;

  note.items.forEach(item => {
    if (item.type === 'in') totalIn += item.amount;
    else totalOut += item.amount;

    const itemTime = item.createdAt || new Date(note.updatedAt).toLocaleDateString('id-ID');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.desc}</td>
      <td>${item.type === 'in' ? '🟢 Masuk' : '🔴 Keluar'}</td>
      <td>Rp ${item.amount.toLocaleString('id-ID')}</td>
      <td><small style="color: #64748b;">${itemTime}</small></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteTransItem(${item.id})">✕</button></td>
    `;
    transListBody.appendChild(tr);

    const rRow = document.createElement('div');
    rRow.className = 'receipt-row';
    const sign = item.type === 'in' ? '+' : '-';
    rRow.innerHTML = `
      <div>
        <div>${item.desc}</div>
        <small style="font-size: 0.65rem; color: #94a3b8;">${itemTime}</small>
      </div>
      <span class="${item.type === 'in' ? 'text-in' : 'text-out'}">${sign}Rp ${item.amount.toLocaleString('id-ID')}</span>
    `;
    receiptItemsList.appendChild(rRow);
  });

  receiptTitleDisplay.textContent = note.title || 'Laporan Keuangan';
  receiptDateDisplay.textContent = `Update: ${new Date(note.updatedAt).toLocaleString('id-ID')}`;
  receiptTotalIn.textContent = `Rp ${totalIn.toLocaleString('id-ID')}`;
  receiptTotalOut.textContent = `Rp ${totalOut.toLocaleString('id-ID')}`;

  const balance = totalIn - totalOut;
  receiptBalance.textContent = `Rp ${balance.toLocaleString('id-ID')}`;
  receiptBalance.className = balance >= 0 ? 'text-in' : 'text-out';
}

financeTitle.addEventListener('input', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (note) {
    note.title = financeTitle.value;
    note.updatedAt = new Date().toISOString();
    saveToStorage();
    renderSidebar(searchInput.value);
    renderFinanceTableAndReceipt();
  }
});

btnExportReceipt.addEventListener('click', () => {
  const receiptElement = document.getElementById('receipt-bill');
  html2canvas(receiptElement, { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `Struk_Catatku_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    if (jsConfetti) {
      jsConfetti.addConfetti({ emojis: ['🥳', '🎉', '📸'] });
    }
  });
});

// HAPUS CATATAN KONFIRMASI KUSTOM
btnDelete.addEventListener('click', async () => {
  const confirmed = await showCustomConfirm('Apakah Anda yakin ingin menghapus catatan ini?', 'Hapus Data', '🗑️');
  
  if (confirmed) {
    notes = notes.filter(n => n.id !== activeNoteId);
    saveToStorage();
    
    const filtered = notes.filter(n => n.type === currentMode);
    if (filtered.length > 0) {
      activeNoteId = filtered[0].id;
    } else {
      createNewNote(currentMode);
    }
    renderSidebar();
    loadActiveNote();
  }
});

btnExportTxt.addEventListener('click', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  const blob = new Blob([note.content], { type: 'text/plain' });
  const anchor = document.createElement('a');
  anchor.download = `${note.title || 'catatan'}.txt`;
  anchor.href = window.URL.createObjectURL(blob);
  anchor.click();
});

searchInput.addEventListener('input', (e) => renderSidebar(e.target.value));

showHomeDashboard();