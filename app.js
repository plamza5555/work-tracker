/**
 * Work Calendar & Task Tracker (Trello-Style Labels)
 * Full-featured offline-ready vanilla JS application
 */

(function () {
  'use strict';

  // --- Initial Default Data (matches user's screenshot) ---
  const DEFAULT_LABELS = [
    { id: 'lbl-1', title: 'สั่งป้ายแล้ว', color: '#216e4e', pattern: 'stripes' },
    { id: 'lbl-2', title: 'ยังไม่ได้สั่งป้าย', color: '#7f5f01', pattern: 'snake' },
    { id: 'lbl-3', title: 'รอออกใบขอ', color: '#a54800', pattern: 'bars' },
    { id: 'lbl-4', title: 'กำลังสั่งป้าย', color: '#ae2e24', pattern: 'dots' },
    { id: 'lbl-5', title: 'รอผู้ตรวจ', color: '#5e4db2', pattern: 'zigzag' },
    { id: 'lbl-6', title: 'กำลังออกแบบ', color: '#943d73', pattern: 'steps' },
    { id: 'lbl-7', title: 'กำลังติดต่อ', color: '#0055cc', pattern: 'lines' }
  ];

  const COLOR_PALETTE = [
    '#216e4e', '#4bce97', '#1f845a',
    '#7f5f01', '#e2b203', '#946f00',
    '#a54800', '#faa53d', '#c25e00',
    '#ae2e24', '#f87168', '#c9372c',
    '#5e4db2', '#9f8fef', '#6e5dc6',
    '#943d73', '#e774bb', '#ae4787',
    '#0055cc', '#579dff', '#0c66e4',
    '#206a83', '#60c6d2', '#287d97',
    '#44546f', '#8590a2', '#626f86'
  ];

  const PATTERN_SVGS = {
    stripes: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="4" y1="20" x2="20" y2="4"></line><line x1="4" y1="12" x2="12" y2="4"></line><line x1="12" y1="20" x2="20" y2="12"></line></svg>`,
    snake: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 16c2-4 6-4 8 0s6 4 8 0"></path><path d="M4 8c2-4 6-4 8 0s6 4 8 0"></path></svg>`,
    bars: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="7" y1="4" x2="7" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line><line x1="17" y1="4" x2="17" y2="20"></line></svg>`,
    dots: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="2.5"></circle><circle cx="18" cy="6" r="2.5"></circle><circle cx="12" cy="12" r="2.5"></circle><circle cx="6" cy="18" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle></svg>`,
    zigzag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 8 10 14 14 10 20 16"></polyline></svg>`,
    steps: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h5v-5h5V8h6"></path></svg>`,
    lines: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line></svg>`
  };

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const THAI_DAYS = [
    'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
  ];

  // --- State Variables ---
  let state = {
    labels: [],
    tasks: {}, // Key: "YYYY-MM-DD" => Array of task objects { id, title, desc, done, tags: [labelId, ...] }
    currentDate: new Date(),
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    activeModalDate: null,
    dayTaskFilter: 'all', // 'all', 'pending', 'done'
    tagFilter: 'all', // 'all' or labelId
    colorblindMode: true,
    theme: 'dark',
    
    // Label popover context
    labelPickerMode: 'task', // 'newTask', 'editTaskLabels', or 'global'
    labelPickerTaskId: null,
    labelPickerDate: null,
    newTaskSelectedTagIds: [],
    
    // Label editor context
    editingLabelId: null,
    selectedEditorColor: '#0055cc'
  };

  // --- Storage Helper Functions ---
  function loadFromStorage() {
    try {
      const savedLabels = localStorage.getItem('work_tracker_labels');
      state.labels = savedLabels ? JSON.parse(savedLabels) : DEFAULT_LABELS;

      const savedTasks = localStorage.getItem('work_tracker_tasks');
      const parsedTasks = savedTasks ? JSON.parse(savedTasks) : null;
      if (!parsedTasks || Object.keys(parsedTasks).length === 0) {
        state.tasks = getInitialDemoTasks();
      } else {
        state.tasks = parsedTasks;
      }

      const savedColorblind = localStorage.getItem('work_tracker_colorblind');
      state.colorblindMode = savedColorblind !== null ? JSON.parse(savedColorblind) : true;

      const savedTheme = localStorage.getItem('work_tracker_theme');
      state.theme = savedTheme || 'dark';
    } catch (e) {
      console.warn('Could not load storage, using default values', e);
      state.labels = DEFAULT_LABELS;
      state.tasks = getInitialDemoTasks();
    }
  }

  function saveLabels() {
    localStorage.setItem('work_tracker_labels', JSON.stringify(state.labels));
  }

  function saveTasks() {
    localStorage.setItem('work_tracker_tasks', JSON.stringify(state.tasks));
  }

  function saveSettings() {
    localStorage.setItem('work_tracker_colorblind', JSON.stringify(state.colorblindMode));
    localStorage.setItem('work_tracker_theme', state.theme);
  }

  function getInitialDemoTasks() {
    const demo = {};
    const nov24Key = '2026-11-24';
    demo[nov24Key] = [
      { id: 'task-1', title: 'กีฬาสีโรงเรียนขัวแคร์', desc: '', done: false, tags: ['lbl-7'] },
      { id: 'task-2', title: 'ผ้าป่ากฐินโรงพยาบาลเทิง', desc: '', done: false, tags: ['lbl-3'] },
      { id: 'task-3', title: 'แข่งขันฟุตบอล ภูมิภูสลอง', desc: '', done: false, tags: ['lbl-3'] },
      { id: 'task-4', title: 'โรงเรียนวัดพระเกิด ป้ายประชาสัมพันธ์', desc: '', done: false, tags: ['lbl-3'] },
      { id: 'task-5', title: 'ศูนย์เครือข่าย การศึกษา แม่ลอยศรีดอนไชยขอสนับสนุน', desc: '', done: false, tags: ['lbl-3'] },
      { id: 'task-6', title: 'ป้ายป้องกันยุงลาย ป่าตึง', desc: '', done: false, tags: ['lbl-3'] }
    ];

    const today = new Date();
    const todayKey = formatDateKey(today);
    if (todayKey !== nov24Key) {
      demo[todayKey] = [
        { id: 'demo-today-1', title: 'ตรวจสอบแบบป้ายโฆษณา', desc: '', done: false, tags: ['lbl-6'] },
        { id: 'demo-today-2', title: 'ติดต่อสอบถามร้านทำป้ายอะคริลิค', desc: '', done: true, tags: ['lbl-1'] }
      ];
    }
    return demo;
  }

  // --- Format Date Helpers ---
  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatThaiFullDate(date) {
    const dayName = THAI_DAYS[date.getDay()];
    const dateNum = date.getDate();
    const monthName = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}ที่ ${dateNum} ${monthName} ${year}`;
  }

  function formatThaiShortDate(date) {
    const d = date.getDate();
    const m = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][date.getMonth()];
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }

  // --- DOM Elements Cache ---
  const el = {
    // Month controls
    currentMonthYear: document.getElementById('currentMonthYear'),
    btnPrevMonth: document.getElementById('btnPrevMonth'),
    btnNextMonth: document.getElementById('btnNextMonth'),
    btnToday: document.getElementById('btnToday'),
    calendarGrid: document.getElementById('calendarGrid'),
    tagFilterSelect: document.getElementById('tagFilterSelect'),

    // Month Stats
    statMonthTotal: document.getElementById('statMonthTotal'),
    statMonthDone: document.getElementById('statMonthDone'),
    statMonthPending: document.getElementById('statMonthPending'),
    statProgressBar: document.getElementById('statProgressBar'),
    statProgressPercent: document.getElementById('statProgressPercent'),

    // Day Modal
    dayModal: document.getElementById('dayModal'),
    btnCloseDayModal: document.getElementById('btnCloseDayModal'),
    modalDateTitle: document.getElementById('modalDateTitle'),
    modalDateSubtitle: document.getElementById('modalDateSubtitle'),
    addTaskForm: document.getElementById('addTaskForm'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    btnOpenNewTaskLabels: document.getElementById('btnOpenNewTaskLabels'),
    newTaskSelectedTagsPills: document.getElementById('newTaskSelectedTagsPills'),
    dayTaskList: document.getElementById('dayTaskList'),
    dayTasksCount: document.getElementById('dayTasksCount'),
    btnCopyDayToTomorrow: document.getElementById('btnCopyDayToTomorrow'),

    // Edit Task Modal
    editTaskModal: document.getElementById('editTaskModal'),
    btnCloseEditTaskModal: document.getElementById('btnCloseEditTaskModal'),
    btnCancelEditTask: document.getElementById('btnCancelEditTask'),
    editTaskForm: document.getElementById('editTaskForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskDate: document.getElementById('editTaskDate'),
    editTaskTitle: document.getElementById('editTaskTitle'),
    editTaskDesc: document.getElementById('editTaskDesc'),

    // Trello Label Picker Modal
    labelPickerModal: document.getElementById('labelPickerModal'),
    btnCloseLabelPicker: document.getElementById('btnCloseLabelPicker'),
    labelListView: document.getElementById('labelListView'),
    labelSearchInput: document.getElementById('labelSearchInput'),
    labelsContainer: document.getElementById('labelsContainer'),
    btnGoToCreateLabel: document.getElementById('btnGoToCreateLabel'),
    btnToggleColorblind: document.getElementById('btnToggleColorblind'),
    colorblindText: document.getElementById('colorblindText'),

    // Label Editor View
    labelEditView: document.getElementById('labelEditView'),
    btnBackToLabelList: document.getElementById('btnBackToLabelList'),
    btnCloseLabelEditor: document.getElementById('btnCloseLabelEditor'),
    labelEditorTitle: document.getElementById('labelEditorTitle'),
    labelTitleInput: document.getElementById('labelTitleInput'),
    colorPaletteGrid: document.getElementById('colorPaletteGrid'),
    customColorPicker: document.getElementById('customColorPicker'),
    customColorHex: document.getElementById('customColorHex'),
    labelLivePreview: document.getElementById('labelLivePreview'),
    previewLabelText: document.getElementById('previewLabelText'),
    btnSaveLabel: document.getElementById('btnSaveLabel'),
    btnDeleteLabel: document.getElementById('btnDeleteLabel'),

    // Backup & Theme
    btnManageLabels: document.getElementById('btnManageLabels'),
    btnBackup: document.getElementById('btnBackup'),
    backupModal: document.getElementById('backupModal'),
    btnCloseBackupModal: document.getElementById('btnCloseBackupModal'),
    btnExportJSON: document.getElementById('btnExportJSON'),
    btnImportJSON: document.getElementById('btnImportJSON'),
    importFileInput: document.getElementById('importFileInput'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    toastContainer: document.getElementById('toastContainer'),

    // Drag & Drop Task Across Days Modal
    dragDropActionModal: document.getElementById('dragDropActionModal'),
    btnCloseDragDropModal: document.getElementById('btnCloseDragDropModal'),
    btnCancelDragDrop: document.getElementById('btnCancelDragDrop'),
    dragTaskPreviewCard: document.getElementById('dragTaskPreviewCard'),
    dragFromDateTxt: document.getElementById('dragFromDateTxt'),
    dragToDateTxt: document.getElementById('dragToDateTxt'),
    btnChoiceCopyTask: document.getElementById('btnChoiceCopyTask'),
    btnChoiceCopyPending: document.getElementById('btnChoiceCopyPending'),
    btnChoiceMoveTask: document.getElementById('btnChoiceMoveTask'),
    btnChoiceCopyTitle: document.getElementById('btnChoiceCopyTitle'),
    btnChoiceCopyDesc: document.getElementById('btnChoiceCopyDesc'),
    btnChoicePendingTitle: document.getElementById('btnChoicePendingTitle'),
    btnChoicePendingDesc: document.getElementById('btnChoicePendingDesc'),
    btnChoiceMoveTitle: document.getElementById('btnChoiceMoveTitle'),
    btnChoiceMoveDesc: document.getElementById('btnChoiceMoveDesc')
  };

  let calendarDragData = null;
  let isCalendarPillDragging = false;

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ️'}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // --- Theme Management ---
  function applyTheme() {
    if (state.theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      el.themeIcon.textContent = '🌙';
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      el.themeIcon.textContent = '☀️';
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveSettings();
    applyTheme();
    showToast(`เปลี่ยนเป็นโหมด ${state.theme === 'dark' ? 'มืด (Dark)' : 'สว่าง (Light)'}`);
  }

  // --- Calendar Rendering ---
  function renderCalendar() {
    const year = state.viewYear;
    const month = state.viewMonth;

    // Set Header Month Title
    el.currentMonthYear.textContent = `${THAI_MONTHS[month]} ${year}`;

    // Update Filter Select Options
    updateTagFilterSelect();

    // Clear calendar grid
    el.calendarGrid.innerHTML = '';

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayKey = formatDateKey(new Date());

    let monthTotalTasks = 0;
    let monthDoneTasks = 0;

    // Previous month filler days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      const cell = createDayCell(prevDate, true, todayKey);
      el.calendarGrid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const tasks = state.tasks[dateKey] || [];

      // Check stats
      tasks.forEach(t => {
        monthTotalTasks++;
        if (t.done) monthDoneTasks++;
      });

      const cell = createDayCell(date, false, todayKey);
      el.calendarGrid.appendChild(cell);
    }

    // Next month filler days (fill out remaining grid up to 35 or 42 cells)
    const totalRendered = firstDayOfMonth + daysInMonth;
    const nextDaysNeeded = totalRendered <= 35 ? (35 - totalRendered) : (42 - totalRendered);
    for (let day = 1; day <= nextDaysNeeded; day++) {
      const nextDate = new Date(year, month + 1, day);
      const cell = createDayCell(nextDate, true, todayKey);
      el.calendarGrid.appendChild(cell);
    }

    // Update Month Stats
    const monthPending = monthTotalTasks - monthDoneTasks;
    const percent = monthTotalTasks > 0 ? Math.round((monthDoneTasks / monthTotalTasks) * 100) : 0;

    el.statMonthTotal.textContent = monthTotalTasks;
    el.statMonthDone.textContent = monthDoneTasks;
    el.statMonthPending.textContent = monthPending;
    el.statProgressBar.style.width = `${percent}%`;
    el.statProgressPercent.textContent = `${percent}%`;
  }

  function createDayCell(date, isOtherMonth, todayKey) {
    const dateKey = formatDateKey(date);
    const tasks = state.tasks[dateKey] || [];
    const isToday = dateKey === todayKey;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('is-today');

    // Filter check
    let filteredTasks = tasks;
    if (state.tagFilter !== 'all') {
      filteredTasks = tasks.filter(t => t.tags && t.tags.includes(state.tagFilter));
    }

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.done).length;

    if (totalTasks > 0) {
      cell.classList.add('has-tasks');
      if (doneTasks === totalTasks) {
        cell.classList.add('all-done');
      }
    }

    // Header (Date number & badge)
    const header = document.createElement('div');
    header.className = 'day-cell-header';

    const numSpan = document.createElement('span');
    numSpan.className = 'day-number';
    numSpan.textContent = date.getDate();
    header.appendChild(numSpan);

    if (totalTasks > 0) {
      const badge = document.createElement('span');
      badge.className = `day-task-count-badge ${doneTasks === totalTasks ? 'done' : ''}`;
      badge.setAttribute('draggable', 'true');
      badge.title = `คลิกลากป้ายนี้เพื่อย้ายหรือคัดลอกทั้ง ${totalTasks} งานไปวันอื่น`;
      badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="6" r="1.5"></circle><circle cx="15" cy="6" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="9" cy="18" r="1.5"></circle><circle cx="15" cy="18" r="1.5"></circle></svg> <span>${doneTasks}/${totalTasks}</span>`;

      // Entire day drag from badge
      badge.addEventListener('dragstart', (e) => {
        isCalendarPillDragging = true;
        calendarDragData = { type: 'all_day', fromDateKey: dateKey, totalTasks, doneTasks };
        e.dataTransfer.setData('text/plain', JSON.stringify(calendarDragData));
        e.dataTransfer.effectAllowed = 'copyMove';
        setTimeout(() => badge.classList.add('is-dragging'), 0);
      });

      badge.addEventListener('dragend', () => {
        badge.classList.remove('is-dragging');
        document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('day-cell-drop-target'));
        setTimeout(() => {
          isCalendarPillDragging = false;
          calendarDragData = null;
        }, 120);
      });

      header.appendChild(badge);
    }

    cell.appendChild(header);

    // Mini tasks previews
    const previewContainer = document.createElement('div');
    previewContainer.className = 'day-cell-tasks-preview';

    const maxDisplay = 3;
    const displayList = filteredTasks.slice(0, maxDisplay);

    displayList.forEach(task => {
      const pill = document.createElement('div');
      pill.className = `mini-task-pill ${task.done ? 'is-done' : ''}`;
      pill.setAttribute('draggable', 'true');
      pill.title = 'คลิกลากไปใส่วันอื่นเพื่อทำงานต่อเนื่องหรือย้ายวัน';

      // Pick first tag color if available
      let tagColor = '#738496';
      if (task.tags && task.tags.length > 0) {
        const firstLabel = state.labels.find(l => l.id === task.tags[0]);
        if (firstLabel) tagColor = firstLabel.color;
      }
      pill.style.borderLeftColor = tagColor;

      const dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.style.backgroundColor = task.done ? 'var(--success-color)' : tagColor;

      const titleSpan = document.createElement('span');
      titleSpan.textContent = task.title;

      pill.appendChild(dot);
      pill.appendChild(titleSpan);

      // Pill Drag events on Calendar
      pill.addEventListener('dragstart', (e) => {
        isCalendarPillDragging = true;
        calendarDragData = { type: 'single_task', taskId: task.id, fromDateKey: dateKey };
        e.dataTransfer.setData('text/plain', JSON.stringify(calendarDragData));
        e.dataTransfer.effectAllowed = 'copyMove';
        setTimeout(() => pill.classList.add('is-dragging'), 0);
      });

      pill.addEventListener('dragend', () => {
        pill.classList.remove('is-dragging');
        document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('day-cell-drop-target'));
        setTimeout(() => {
          isCalendarPillDragging = false;
          calendarDragData = null;
        }, 120);
      });

      previewContainer.appendChild(pill);
    });

    if (filteredTasks.length > maxDisplay) {
      const more = document.createElement('div');
      more.className = 'more-tasks-indicator';
      more.setAttribute('draggable', 'true');
      more.title = `คลิกลากเพื่อย้าย/คัดลอกทั้ง ${totalTasks} งานของวันนี้ไปวันอื่น`;
      more.textContent = `+ อีก ${filteredTasks.length - maxDisplay} งาน (ลากทั้งวันได้)`;

      more.addEventListener('dragstart', (e) => {
        isCalendarPillDragging = true;
        calendarDragData = { type: 'all_day', fromDateKey: dateKey, totalTasks, doneTasks };
        e.dataTransfer.setData('text/plain', JSON.stringify(calendarDragData));
        e.dataTransfer.effectAllowed = 'copyMove';
        setTimeout(() => more.classList.add('is-dragging'), 0);
      });

      more.addEventListener('dragend', () => {
        more.classList.remove('is-dragging');
        document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('day-cell-drop-target'));
        setTimeout(() => {
          isCalendarPillDragging = false;
          calendarDragData = null;
        }, 120);
      });

      previewContainer.appendChild(more);
    }

    cell.appendChild(previewContainer);

    // Cell Dragover & Drop events for receiving dragged tasks
    cell.addEventListener('dragover', (e) => {
      if (calendarDragData && calendarDragData.fromDateKey !== dateKey) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        cell.classList.add('day-cell-drop-target');
      }
    });

    cell.addEventListener('dragleave', (e) => {
      if (!cell.contains(e.relatedTarget)) {
        cell.classList.remove('day-cell-drop-target');
      }
    });

    cell.addEventListener('drop', (e) => {
      if (calendarDragData && calendarDragData.fromDateKey !== dateKey) {
        e.preventDefault();
        cell.classList.remove('day-cell-drop-target');
        promptCalendarTaskDrop(calendarDragData, dateKey);
      }
    });

    // Click handler to open day detail
    cell.addEventListener('click', () => {
      if (isCalendarPillDragging) return;
      openDayModal(dateKey);
    });

    return cell;
  }

  // --- Calendar Drag & Drop Across Days Controller ---
  let pendingDropData = null;

  function promptCalendarTaskDrop(dragData, toDateKey) {
    const fromDateKey = dragData.fromDateKey;
    const fromDate = parseDateKey(fromDateKey);
    const toDate = parseDateKey(toDateKey);

    const fromTasks = state.tasks[fromDateKey] || [];
    if (fromTasks.length === 0) return;

    pendingDropData = { dragData, fromDateKey, toDateKey, fromTasks };

    el.dragFromDateTxt.textContent = `จาก: ${formatThaiShortDate(fromDate)}`;
    el.dragToDateTxt.textContent = `ไปยัง: ${formatThaiShortDate(toDate)}`;

    if (dragData.type === 'all_day') {
      // Dragging entire day
      const totalCount = fromTasks.length;
      const doneCount = fromTasks.filter(t => t.done).length;
      const pendingCount = totalCount - doneCount;

      document.getElementById('dragDropModalHeader').textContent = `📅 จัดการงานทั้งหมดของวัน (${totalCount} งาน)`;
      
      // Preview card showing list of all tasks in that day
      el.dragTaskPreviewCard.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
          <div style="font-weight: 600; font-size: 0.92rem; color: var(--accent-primary);">
            งานทั้งหมด ${totalCount} งาน (${doneCount > 0 ? `เสร็จแล้ว ${doneCount}, ` : ''}ค้างอยู่ ${pendingCount} งาน)
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); max-height: 80px; overflow-y: auto;">
            ${fromTasks.map(t => `<div>• ${t.title} ${t.done ? '<span style="color:var(--success-color);">(เสร็จแล้ว)</span>' : ''}</div>`).join('')}
          </div>
        </div>
      `;

      el.btnChoiceCopyTitle.textContent = `คัดลอกทั้งวันไปทำต่อ (ทั้ง ${totalCount} งาน)`;
      el.btnChoiceCopyDesc.textContent = `สร้างงานทั้ง ${totalCount} งานในวันใหม่เพื่อทำต่อ โดยคงข้อมูล Tags และรายละเอียดไว้ครบถ้วน`;

      // If some tasks are done and some are pending, offer copy pending only
      if (pendingCount > 0 && doneCount > 0) {
        el.btnChoiceCopyPending.style.display = 'flex';
        el.btnChoicePendingTitle.textContent = `คัดลอกเฉพาะงานที่ยังไม่เสร็จ (${pendingCount} งาน)`;
        el.btnChoicePendingDesc.textContent = `คัดลอกเฉพาะงานที่ยังค้างอยู่ไปทำต่อในวันถัดไป (งานที่เสร็จแล้ว ${doneCount} งานจะคงอยู่ที่เดิม)`;
      } else {
        el.btnChoiceCopyPending.style.display = 'none';
      }

      el.btnChoiceMoveTitle.textContent = `ย้ายงานทั้งวันไปวันใหม่ (ทั้ง ${totalCount} งาน)`;
      el.btnChoiceMoveDesc.textContent = `ย้ายงานทั้งหมดจากวันเดิมไปอยู่วันใหม่แทน (ลบออกจากวันเดิม)`;

    } else {
      // Single task drag
      const task = fromTasks.find(t => t.id === dragData.taskId);
      if (!task) return;

      document.getElementById('dragDropModalHeader').textContent = `📅 จัดการงานต่อเนื่องข้ามวัน`;

      el.dragTaskPreviewCard.innerHTML = `
        <div class="drag-task-preview-title">${task.title}</div>
        <div id="dragTaskTagsRow" class="task-tags-row"></div>
      `;

      const tagsRow = el.dragTaskPreviewCard.querySelector('#dragTaskTagsRow');
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tid => {
          const lbl = state.labels.find(l => l.id === tid);
          if (lbl) {
            tagsRow.appendChild(createTagBadge(lbl));
          }
        });
      }

      el.btnChoiceCopyTitle.textContent = `คัดลอกเพื่อทำงานต่อเนื่อง`;
      el.btnChoiceCopyDesc.textContent = `สร้างงานนี้ในวันใหม่เพื่อทำต่อ (โดยคงงานในวันเดิมไว้ด้วย)`;
      el.btnChoiceCopyPending.style.display = 'none';

      el.btnChoiceMoveTitle.textContent = `ย้ายงานไปวันใหม่`;
      el.btnChoiceMoveDesc.textContent = `ย้ายงานนี้จากวันเดิมไปอยู่วันใหม่แทน (ลบออกจากวันเดิม)`;
    }

    el.dragDropActionModal.classList.add('active');
  }

  function closeDragDropModal() {
    el.dragDropActionModal.classList.remove('active');
    pendingDropData = null;
  }

  function handleConfirmCopyTask() {
    if (!pendingDropData) return;
    const { dragData, fromTasks, toDateKey } = pendingDropData;

    if (!state.tasks[toDateKey]) {
      state.tasks[toDateKey] = [];
    }

    const toDate = parseDateKey(toDateKey);

    if (dragData.type === 'all_day') {
      // Copy all tasks of the day
      fromTasks.forEach(task => {
        const newTask = {
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: task.title,
          desc: task.desc || '',
          done: false, // Reset done for continuous work
          tags: [...(task.tags || [])]
        };
        state.tasks[toDateKey].push(newTask);
      });

      saveTasks();
      renderCalendar();
      if (state.activeModalDate === toDateKey) renderDayTasks();

      showToast(`คัดลอกทั้ง ${fromTasks.length} งานไปทำต่อใน ${formatThaiShortDate(toDate)} สำเร็จ 🎉`);
    } else {
      // Single task copy
      const task = fromTasks.find(t => t.id === dragData.taskId);
      if (task) {
        const newTask = {
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: task.title,
          desc: task.desc || '',
          done: false,
          tags: [...(task.tags || [])]
        };
        state.tasks[toDateKey].push(newTask);
        saveTasks();
        renderCalendar();
        if (state.activeModalDate === toDateKey) renderDayTasks();
        showToast(`คัดลอกงานไปทำต่อใน ${formatThaiShortDate(toDate)} สำเร็จ 🎉`);
      }
    }

    closeDragDropModal();
  }

  function handleConfirmCopyPending() {
    if (!pendingDropData) return;
    const { fromTasks, toDateKey } = pendingDropData;

    const pendingTasks = fromTasks.filter(t => !t.done);
    if (pendingTasks.length === 0) return;

    if (!state.tasks[toDateKey]) {
      state.tasks[toDateKey] = [];
    }

    pendingTasks.forEach(task => {
      const newTask = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: task.title,
        desc: task.desc || '',
        done: false,
        tags: [...(task.tags || [])]
      };
      state.tasks[toDateKey].push(newTask);
    });

    saveTasks();
    renderCalendar();
    if (state.activeModalDate === toDateKey) renderDayTasks();

    const toDate = parseDateKey(toDateKey);
    showToast(`คัดลอกเฉพาะงานค้าง ${pendingTasks.length} งานไปทำต่อใน ${formatThaiShortDate(toDate)} สำเร็จ 🎉`);
    closeDragDropModal();
  }

  function handleConfirmMoveTask() {
    if (!pendingDropData) return;
    const { dragData, fromDateKey, fromTasks, toDateKey } = pendingDropData;
    const toDate = parseDateKey(toDateKey);

    if (!state.tasks[toDateKey]) {
      state.tasks[toDateKey] = [];
    }

    if (dragData.type === 'all_day') {
      // Move all tasks of the day
      fromTasks.forEach(t => state.tasks[toDateKey].push(t));
      delete state.tasks[fromDateKey];

      saveTasks();
      renderCalendar();
      if (state.activeModalDate === fromDateKey || state.activeModalDate === toDateKey) {
        renderDayTasks();
      }
      showToast(`ย้ายทั้ง ${fromTasks.length} งานไปยัง ${formatThaiShortDate(toDate)} สำเร็จ`);
    } else {
      // Single task move
      const task = fromTasks.find(t => t.id === dragData.taskId);
      if (task) {
        state.tasks[fromDateKey] = state.tasks[fromDateKey].filter(t => t.id !== task.id);
        if (state.tasks[fromDateKey].length === 0) {
          delete state.tasks[fromDateKey];
        }
        state.tasks[toDateKey].push(task);

        saveTasks();
        renderCalendar();
        if (state.activeModalDate === fromDateKey || state.activeModalDate === toDateKey) {
          renderDayTasks();
        }
        showToast(`ย้ายงานไปยัง ${formatThaiShortDate(toDate)} สำเร็จ`);
      }
    }

    closeDragDropModal();
  }

  function updateTagFilterSelect() {
    const currentVal = el.tagFilterSelect.value;
    el.tagFilterSelect.innerHTML = `<option value="all">🏷️ ทุก Tags (${state.labels.length})</option>`;
    state.labels.forEach(lbl => {
      const opt = document.createElement('option');
      opt.value = lbl.id;
      opt.textContent = `● ${lbl.title}`;
      el.tagFilterSelect.appendChild(opt);
    });
    el.tagFilterSelect.value = state.labels.some(l => l.id === currentVal) ? currentVal : 'all';
  }

  // --- Day Detail Modal ---
  function openDayModal(dateKey) {
    state.activeModalDate = dateKey;
    const date = parseDateKey(dateKey);

    el.modalDateTitle.textContent = formatThaiFullDate(date);
    state.newTaskSelectedTagIds = [];
    renderNewTaskSelectedTags();
    el.taskTitleInput.value = '';
    el.taskDescInput.value = '';

    renderDayTasks();
    el.dayModal.classList.add('active');
  }

  function closeDayModal() {
    el.dayModal.classList.remove('active');
    state.activeModalDate = null;
    renderCalendar();
  }

  function renderDayTasks() {
    if (!state.activeModalDate) return;
    const dateKey = state.activeModalDate;
    const tasks = state.tasks[dateKey] || [];

    const total = tasks.length;
    const doneCount = tasks.filter(t => t.done).length;
    const pendingCount = total - doneCount;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    el.modalDateSubtitle.textContent = `${total} งาน (เสร็จแล้ว ${doneCount} งาน, เหลือ ${pendingCount} งาน)`;
    el.dayTasksCount.textContent = total;

    // Update Day Sidebar Stats
    const dayProgressFill = document.getElementById('dayProgressBar');
    const dayProgressTxt = document.getElementById('dayProgressPercent');
    if (dayProgressFill) dayProgressFill.style.width = `${percent}%`;
    if (dayProgressTxt) dayProgressTxt.textContent = `${percent}%`;

    const countAll = document.getElementById('countTabAll');
    const countPending = document.getElementById('countTabPending');
    const countDone = document.getElementById('countTabDone');
    if (countAll) countAll.textContent = total;
    if (countPending) countPending.textContent = pendingCount;
    if (countDone) countDone.textContent = doneCount;

    // Filter by tab
    let displayTasks = tasks;
    if (state.dayTaskFilter === 'pending') {
      displayTasks = tasks.filter(t => !t.done);
    } else if (state.dayTaskFilter === 'done') {
      displayTasks = tasks.filter(t => t.done);
    }

    el.dayTaskList.innerHTML = '';

    if (displayTasks.length === 0) {
      el.dayTaskList.innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <p>${total === 0 ? 'ยังไม่มีงานที่บันทึกในวันนี้' : 'ไม่มีงานที่ตรงกับตัวกรอง'}</p>
        </div>
      `;
      return;
    }

    let draggedTaskId = null;

    displayTasks.forEach((task, index) => {
      const item = document.createElement('div');
      item.className = `task-item ${task.done ? 'is-completed' : ''}`;
      item.setAttribute('draggable', 'true');
      item.dataset.taskId = task.id;

      // Drag Handle
      const dragHandle = document.createElement('div');
      dragHandle.className = 'task-drag-handle';
      dragHandle.title = 'คลิกลากเพื่อจัดลำดับงาน';
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="8" cy="6" r="1.5"></circle><circle cx="16" cy="6" r="1.5"></circle><circle cx="8" cy="12" r="1.5"></circle><circle cx="16" cy="12" r="1.5"></circle><circle cx="8" cy="18" r="1.5"></circle><circle cx="16" cy="18" r="1.5"></circle></svg>`;

      // Checkbox
      const checkContainer = document.createElement('div');
      checkContainer.className = 'task-checkbox-container';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'custom-checkbox';
      checkbox.checked = !!task.done;
      checkbox.title = task.done ? 'คลิกเพื่อเปลี่ยนเป็นยังไม่เสร็จ' : 'คลิกเมื่อสำเร็จงานนี้';
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveTasks();
        renderDayTasks();
        renderCalendar();
        showToast(task.done ? 'งานสำเร็จเรียบร้อยแล้ว 🎉' : 'ปรับสถานะเป็นกำลังดำเนินการ');
      });
      checkContainer.appendChild(checkbox);

      // Content
      const content = document.createElement('div');
      content.className = 'task-content';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'task-title-wrap';

      const title = document.createElement('div');
      title.className = 'task-title';
      title.textContent = task.title;
      titleWrap.appendChild(title);

      if (task.desc && task.desc.trim()) {
        const desc = document.createElement('div');
        desc.className = 'task-desc';
        desc.textContent = task.desc;
        titleWrap.appendChild(desc);
      }
      content.appendChild(titleWrap);

      // Tags Badges
      const tagsRow = document.createElement('div');
      tagsRow.className = 'task-tags-row';

      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tagId => {
          const label = state.labels.find(l => l.id === tagId);
          if (label) {
            const badge = createTagBadge(label);
            tagsRow.appendChild(badge);
          }
        });
      }

      // Quick Tag Add Button
      const addTagBtn = document.createElement('button');
      addTagBtn.type = 'button';
      addTagBtn.className = 'btn btn-sm btn-outline';
      addTagBtn.style.padding = '1px 6px';
      addTagBtn.style.fontSize = '0.72rem';
      addTagBtn.innerHTML = `+ Tag`;
      addTagBtn.title = 'จัดการ Tags สำหรับงานนี้';
      addTagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLabelPickerForTask(task.id, dateKey);
      });
      tagsRow.appendChild(addTagBtn);

      content.appendChild(tagsRow);

      // Actions (Move Up/Down, Edit, Delete)
      const actions = document.createElement('div');
      actions.className = 'task-actions';

      // Move Up Button
      if (index > 0) {
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'btn-icon move-btn';
        upBtn.title = 'เลื่อนขึ้น';
        upBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
        upBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          moveTaskOffset(task.id, -1);
        });
        actions.appendChild(upBtn);
      }

      // Move Down Button
      if (index < displayTasks.length - 1) {
        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'btn-icon move-btn';
        downBtn.title = 'เลื่อนลง';
        downBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        downBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          moveTaskOffset(task.id, 1);
        });
        actions.appendChild(downBtn);
      }

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon';
      editBtn.title = 'แก้ไขข้อความงาน';
      editBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
      editBtn.addEventListener('click', () => {
        openEditTaskModal(task, dateKey);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon';
      delBtn.title = 'ลบงานนี้';
      delBtn.style.color = 'var(--danger-color)';
      delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      delBtn.addEventListener('click', () => {
        if (confirm(`คุณต้องการลบงาน "${task.title}" ใช่หรือไม่?`)) {
          deleteTask(task.id, dateKey);
        }
      });

      // Prevent drag on interactive buttons
      [checkbox, addTagBtn, editBtn, delBtn].forEach(el => {
        if (el) el.addEventListener('mousedown', (e) => e.stopPropagation());
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      item.appendChild(dragHandle);
      item.appendChild(checkContainer);
      item.appendChild(content);
      item.appendChild(actions);

      // Drag and Drop Events
      item.addEventListener('dragstart', (e) => {
        draggedTaskId = task.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        setTimeout(() => item.classList.add('is-dragging'), 0);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
        document.querySelectorAll('.task-item').forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        draggedTaskId = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!draggedTaskId || draggedTaskId === task.id) return;
        e.dataTransfer.dropEffect = 'move';

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          item.classList.add('drag-over-top');
          item.classList.remove('drag-over-bottom');
        } else {
          item.classList.add('drag-over-bottom');
          item.classList.remove('drag-over-top');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
        const isTop = item.classList.contains('drag-over-top');
        item.classList.remove('drag-over-top', 'drag-over-bottom');

        if (sourceId && sourceId !== task.id) {
          reorderTask(sourceId, task.id, isTop);
        }
      });

      el.dayTaskList.appendChild(item);
    });
  }

  function reorderTask(sourceId, targetId, insertBefore) {
    const dateKey = state.activeModalDate;
    if (!dateKey || !state.tasks[dateKey]) return;
    const list = state.tasks[dateKey];

    const fromIdx = list.findIndex(t => t.id === sourceId);
    const toIdx = list.findIndex(t => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [movedItem] = list.splice(fromIdx, 1);
    let newIdx = list.findIndex(t => t.id === targetId);
    if (!insertBefore) {
      newIdx += 1;
    }
    list.splice(newIdx, 0, movedItem);

    saveTasks();
    renderDayTasks();
    renderCalendar();
    showToast('จัดลำดับงานเรียบร้อยแล้ว');
  }

  function moveTaskOffset(taskId, offset) {
    const dateKey = state.activeModalDate;
    if (!dateKey || !state.tasks[dateKey]) return;
    const list = state.tasks[dateKey];

    const curIdx = list.findIndex(t => t.id === taskId);
    if (curIdx === -1) return;
    const targetIdx = curIdx + offset;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const [item] = list.splice(curIdx, 1);
    list.splice(targetIdx, 0, item);

    saveTasks();
    renderDayTasks();
    renderCalendar();
  }

  function createTagBadge(label, removable = false, onRemove = null) {
    const badge = document.createElement('span');
    badge.className = `tag-badge ${removable ? 'tag-badge-removable' : ''}`;
    badge.style.backgroundColor = label.color;

    if (state.colorblindMode && label.pattern && PATTERN_SVGS[label.pattern]) {
      const patternSpan = document.createElement('span');
      patternSpan.className = 'label-pattern';
      patternSpan.innerHTML = PATTERN_SVGS[label.pattern];
      badge.appendChild(patternSpan);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = label.title;
    badge.appendChild(textSpan);

    if (removable && onRemove) {
      const closeSpan = document.createElement('span');
      closeSpan.innerHTML = ' &times;';
      closeSpan.style.marginLeft = '4px';
      closeSpan.style.fontWeight = 'bold';
      badge.appendChild(closeSpan);
      badge.addEventListener('click', onRemove);
    }

    return badge;
  }

  function renderNewTaskSelectedTags() {
    el.newTaskSelectedTagsPills.innerHTML = '';
    state.newTaskSelectedTagIds.forEach(id => {
      const label = state.labels.find(l => l.id === id);
      if (label) {
        const badge = createTagBadge(label, true, () => {
          state.newTaskSelectedTagIds = state.newTaskSelectedTagIds.filter(tid => tid !== id);
          renderNewTaskSelectedTags();
        });
        el.newTaskSelectedTagsPills.appendChild(badge);
      }
    });
  }

  function handleAddNewTask(e) {
    e.preventDefault();
    const title = el.taskTitleInput.value.trim();
    if (!title) return;

    const desc = el.taskDescInput.value.trim();
    const dateKey = state.activeModalDate;
    if (!dateKey) return;

    if (!state.tasks[dateKey]) {
      state.tasks[dateKey] = [];
    }

    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: title,
      desc: desc,
      done: false,
      tags: [...state.newTaskSelectedTagIds]
    };

    state.tasks[dateKey].unshift(newTask);
    saveTasks();

    // Reset inputs
    el.taskTitleInput.value = '';
    el.taskDescInput.value = '';
    state.newTaskSelectedTagIds = [];
    renderNewTaskSelectedTags();

    renderDayTasks();
    renderCalendar();
    showToast('เพิ่มงานใหม่เรียบร้อยแล้ว');
  }

  function deleteTask(taskId, dateKey) {
    if (!state.tasks[dateKey]) return;
    state.tasks[dateKey] = state.tasks[dateKey].filter(t => t.id !== taskId);
    if (state.tasks[dateKey].length === 0) {
      delete state.tasks[dateKey];
    }
    saveTasks();
    renderDayTasks();
    renderCalendar();
    showToast('ลบงานเรียบร้อยแล้ว');
  }

  // --- Edit Task Modal ---
  function openEditTaskModal(task, dateKey) {
    el.editTaskId.value = task.id;
    el.editTaskDate.value = dateKey;
    el.editTaskTitle.value = task.title;
    el.editTaskDesc.value = task.desc || '';
    el.editTaskModal.classList.add('active');
  }

  function closeEditTaskModal() {
    el.editTaskModal.classList.remove('active');
  }

  function handleSaveEditTask(e) {
    e.preventDefault();
    const taskId = el.editTaskId.value;
    const dateKey = el.editTaskDate.value;
    const title = el.editTaskTitle.value.trim();
    const desc = el.editTaskDesc.value.trim();

    if (!title || !dateKey || !state.tasks[dateKey]) return;

    const task = state.tasks[dateKey].find(t => t.id === taskId);
    if (task) {
      task.title = title;
      task.desc = desc;
      saveTasks();
      renderDayTasks();
      renderCalendar();
      closeEditTaskModal();
      showToast('แก้ไขข้อมูลงานสำเร็จ');
    }
  }

  // --- ========================================== ---
  // --- TRELLO-STYLE LABELS POPOVER CONTROLLER ---
  // --- ========================================== ---

  function openLabelPickerForNewTask() {
    state.labelPickerMode = 'newTask';
    state.labelPickerTaskId = null;
    showLabelListView();
    renderLabelList();
    el.labelPickerModal.classList.add('active');
  }

  function openLabelPickerForTask(taskId, dateKey) {
    state.labelPickerMode = 'editTaskLabels';
    state.labelPickerTaskId = taskId;
    state.labelPickerDate = dateKey;
    showLabelListView();
    renderLabelList();
    el.labelPickerModal.classList.add('active');
  }

  function openGlobalLabelManager() {
    state.labelPickerMode = 'global';
    state.labelPickerTaskId = null;
    showLabelListView();
    renderLabelList();
    el.labelPickerModal.classList.add('active');
  }

  function closeLabelPicker() {
    el.labelPickerModal.classList.remove('active');
    // If we were editing tags for new task, update preview
    if (state.labelPickerMode === 'newTask') {
      renderNewTaskSelectedTags();
    }
    renderCalendar();
  }

  function showLabelListView() {
    el.labelListView.classList.add('active');
    el.labelEditView.classList.remove('active');
    el.labelSearchInput.value = '';
  }

  function showLabelEditView(labelId = null) {
    el.labelListView.classList.remove('active');
    el.labelEditView.classList.add('active');

    state.editingLabelId = labelId;
    renderColorPalette();

    if (labelId) {
      // Editing existing label
      const label = state.labels.find(l => l.id === labelId);
      el.labelEditorTitle.textContent = 'Edit label';
      el.labelTitleInput.value = label ? label.title : '';
      state.selectedEditorColor = label ? label.color : '#0055cc';
      el.btnDeleteLabel.style.display = 'inline-flex';
    } else {
      // Creating new label
      el.labelEditorTitle.textContent = 'Create label';
      el.labelTitleInput.value = '';
      state.selectedEditorColor = COLOR_PALETTE[0];
      el.btnDeleteLabel.style.display = 'none';
    }

    el.customColorPicker.value = state.selectedEditorColor;
    el.customColorHex.textContent = state.selectedEditorColor;
    updateLivePreview();
  }

  function renderLabelList() {
    const searchTerm = el.labelSearchInput.value.toLowerCase().trim();
    el.labelsContainer.innerHTML = '';

    // Determine which tags are currently active for checkbox checkmark
    let activeTagIds = [];
    if (state.labelPickerMode === 'newTask') {
      activeTagIds = state.newTaskSelectedTagIds;
    } else if (state.labelPickerMode === 'editTaskLabels' && state.labelPickerTaskId && state.labelPickerDate) {
      const task = (state.tasks[state.labelPickerDate] || []).find(t => t.id === state.labelPickerTaskId);
      if (task && task.tags) {
        activeTagIds = task.tags;
      }
    }

    const filteredLabels = state.labels.filter(lbl => 
      !searchTerm || lbl.title.toLowerCase().includes(searchTerm)
    );

    filteredLabels.forEach(label => {
      const row = document.createElement('div');
      row.className = 'trello-label-row';

      // Checkbox
      const isChecked = activeTagIds.includes(label.id);
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'trello-label-checkbox';
      checkbox.checked = isChecked;

      checkbox.addEventListener('change', () => {
        toggleLabelSelection(label.id);
      });

      // Colored Label Pill
      const pill = document.createElement('div');
      pill.className = 'trello-label-pill';
      pill.style.backgroundColor = label.color;

      if (state.colorblindMode && label.pattern && PATTERN_SVGS[label.pattern]) {
        const patternSpan = document.createElement('span');
        patternSpan.className = 'label-pattern';
        patternSpan.innerHTML = PATTERN_SVGS[label.pattern];
        pill.appendChild(patternSpan);
      }

      const textSpan = document.createElement('span');
      textSpan.className = 'label-text';
      textSpan.textContent = label.title;
      pill.appendChild(textSpan);

      // Clicking pill also toggles checkbox
      pill.addEventListener('click', () => {
        toggleLabelSelection(label.id);
      });

      // Edit Button (Pencil Icon)
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'trello-label-edit-btn';
      editBtn.title = 'Edit label';
      editBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showLabelEditView(label.id);
      });

      row.appendChild(checkbox);
      row.appendChild(pill);
      row.appendChild(editBtn);

      el.labelsContainer.appendChild(row);
    });

    if (filteredLabels.length === 0) {
      el.labelsContainer.innerHTML = `<div style="padding: 12px; text-align: center; color: #9fadbc; font-size: 0.85rem;">No labels found</div>`;
    }

    // Colorblind toggle text
    el.colorblindText.textContent = state.colorblindMode ? 'Disable colorblind friendly mode' : 'Enable colorblind friendly mode';
  }

  function toggleLabelSelection(labelId) {
    if (state.labelPickerMode === 'newTask') {
      if (state.newTaskSelectedTagIds.includes(labelId)) {
        state.newTaskSelectedTagIds = state.newTaskSelectedTagIds.filter(id => id !== labelId);
      } else {
        state.newTaskSelectedTagIds.push(labelId);
      }
      renderLabelList();
      renderNewTaskSelectedTags();
    } else if (state.labelPickerMode === 'editTaskLabels') {
      const task = (state.tasks[state.labelPickerDate] || []).find(t => t.id === state.labelPickerTaskId);
      if (task) {
        if (!task.tags) task.tags = [];
        if (task.tags.includes(labelId)) {
          task.tags = task.tags.filter(id => id !== labelId);
        } else {
          task.tags.push(labelId);
        }
        saveTasks();
        renderLabelList();
        renderDayTasks();
        renderCalendar();
      }
    }
  }

  // --- Label Editor (Create / Edit) ---
  function renderColorPalette() {
    el.colorPaletteGrid.innerHTML = '';
    COLOR_PALETTE.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${state.selectedEditorColor.toLowerCase() === hex.toLowerCase() ? 'selected' : ''}`;
      swatch.style.backgroundColor = hex;
      swatch.addEventListener('click', () => {
        state.selectedEditorColor = hex;
        el.customColorPicker.value = hex;
        el.customColorHex.textContent = hex;
        renderColorPalette();
        updateLivePreview();
      });
      el.colorPaletteGrid.appendChild(swatch);
    });
  }

  function updateLivePreview() {
    const text = el.labelTitleInput.value.trim() || 'Label Preview';
    el.previewLabelText.textContent = text;
    el.labelLivePreview.style.backgroundColor = state.selectedEditorColor;
  }

  function handleSaveLabel() {
    const title = el.labelTitleInput.value.trim();
    if (!title) {
      alert('กรุณาระบุชื่อ Label');
      return;
    }

    const color = state.selectedEditorColor;

    if (state.editingLabelId) {
      // Update existing
      const label = state.labels.find(l => l.id === state.editingLabelId);
      if (label) {
        label.title = title;
        label.color = color;
        showToast(`แก้ไข Tag "${title}" เรียบร้อยแล้ว`);
      }
    } else {
      // Create new
      const patternKeys = Object.keys(PATTERN_SVGS);
      const randomPattern = patternKeys[state.labels.length % patternKeys.length];
      const newLabel = {
        id: 'lbl-' + Date.now(),
        title: title,
        color: color,
        pattern: randomPattern
      };
      state.labels.push(newLabel);
      showToast(`สร้าง Tag ใหม่ "${title}" เรียบร้อยแล้ว`);
    }

    saveLabels();
    updateTagFilterSelect();
    showLabelListView();
    renderLabelList();
    renderNewTaskSelectedTags();
    renderDayTasks();
    renderCalendar();
  }

  function handleDeleteLabel() {
    if (!state.editingLabelId) return;
    const label = state.labels.find(l => l.id === state.editingLabelId);
    if (!label) return;

    if (confirm(`คุณต้องการลบ Tag "${label.title}" ใช่หรือไม่? (Tag นี้จะถูกนำออกจากทุกงาน)`)) {
      state.labels = state.labels.filter(l => l.id !== state.editingLabelId);
      // Remove this label from all tasks
      Object.keys(state.tasks).forEach(dKey => {
        state.tasks[dKey].forEach(t => {
          if (t.tags) {
            t.tags = t.tags.filter(tid => tid !== state.editingLabelId);
          }
        });
      });
      state.newTaskSelectedTagIds = state.newTaskSelectedTagIds.filter(id => id !== state.editingLabelId);

      saveLabels();
      saveTasks();
      updateTagFilterSelect();
      showLabelListView();
      renderLabelList();
      renderNewTaskSelectedTags();
      renderDayTasks();
      renderCalendar();
      showToast('ลบ Tag เรียบร้อยแล้ว');
    }
  }

  // --- Export & Import ---
  function exportData() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      labels: state.labels,
      tasks: state.tasks,
      colorblindMode: state.colorblindMode,
      theme: state.theme
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work_tracker_backup_${formatDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์ Backup สำเร็จ');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        if (data.labels && data.tasks) {
          state.labels = data.labels;
          state.tasks = data.tasks;
          if (data.colorblindMode !== undefined) state.colorblindMode = data.colorblindMode;
          if (data.theme) state.theme = data.theme;

          saveLabels();
          saveTasks();
          saveSettings();
          applyTheme();
          renderCalendar();
          if (state.activeModalDate) renderDayTasks();

          el.backupModal.classList.remove('active');
          showToast('กู้คืนข้อมูลสำเร็จเรียบร้อย 🎉');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  }

  // --- Event Listeners Initialization ---
  function initEventListeners() {
    // Month navigation
    el.btnPrevMonth.addEventListener('click', () => {
      state.viewMonth--;
      if (state.viewMonth < 0) {
        state.viewMonth = 11;
        state.viewYear--;
      }
      renderCalendar();
    });

    el.btnNextMonth.addEventListener('click', () => {
      state.viewMonth++;
      if (state.viewMonth > 11) {
        state.viewMonth = 0;
        state.viewYear++;
      }
      renderCalendar();
    });

    el.btnToday.addEventListener('click', () => {
      const now = new Date();
      state.viewYear = now.getFullYear();
      state.viewMonth = now.getMonth();
      renderCalendar();
    });

    // Tag filter select
    el.tagFilterSelect.addEventListener('change', (e) => {
      state.tagFilter = e.target.value;
      renderCalendar();
    });

    // Day modal controls
    el.btnCloseDayModal.addEventListener('click', closeDayModal);
    el.addTaskForm.addEventListener('submit', handleAddNewTask);

    if (el.btnCopyDayToTomorrow) {
      el.btnCopyDayToTomorrow.addEventListener('click', () => {
        if (!state.activeModalDate) return;
        const curDate = parseDateKey(state.activeModalDate);
        const tomorrow = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() + 1);
        const tomorrowKey = formatDateKey(tomorrow);
        const activeDateKey = state.activeModalDate;
        closeDayModal();
        promptCalendarTaskDrop({ type: 'all_day', fromDateKey: activeDateKey }, tomorrowKey);
      });
    }

    // Quick filter tabs in Day modal
    document.querySelectorAll('.btn-filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.dayTaskFilter = btn.dataset.filter;
        renderDayTasks();
      });
    });

    // Label Picker Modal controls
    el.btnOpenNewTaskLabels.addEventListener('click', openLabelPickerForNewTask);
    el.btnManageLabels.addEventListener('click', openGlobalLabelManager);
    el.btnCloseLabelPicker.addEventListener('click', closeLabelPicker);

    el.labelSearchInput.addEventListener('input', renderLabelList);
    el.btnGoToCreateLabel.addEventListener('click', () => showLabelEditView(null));
    el.btnToggleColorblind.addEventListener('click', () => {
      state.colorblindMode = !state.colorblindMode;
      saveSettings();
      renderLabelList();
      renderNewTaskSelectedTags();
      renderDayTasks();
      renderCalendar();
    });

    // Label Edit View controls
    el.btnBackToLabelList.addEventListener('click', showLabelListView);
    el.btnCloseLabelEditor.addEventListener('click', closeLabelPicker);
    el.labelTitleInput.addEventListener('input', updateLivePreview);

    el.customColorPicker.addEventListener('input', (e) => {
      state.selectedEditorColor = e.target.value;
      el.customColorHex.textContent = e.target.value;
      renderColorPalette();
      updateLivePreview();
    });

    el.btnSaveLabel.addEventListener('click', handleSaveLabel);
    el.btnDeleteLabel.addEventListener('click', handleDeleteLabel);

    // Edit Task Modal controls
    el.btnCloseEditTaskModal.addEventListener('click', closeEditTaskModal);
    el.btnCancelEditTask.addEventListener('click', closeEditTaskModal);
    el.editTaskForm.addEventListener('submit', handleSaveEditTask);

    // Backup & Restore
    el.btnBackup.addEventListener('click', () => el.backupModal.classList.add('active'));
    el.btnCloseBackupModal.addEventListener('click', () => el.backupModal.classList.remove('active'));
    el.btnExportJSON.addEventListener('click', exportData);
    el.btnImportJSON.addEventListener('click', () => el.importFileInput.click());
    el.importFileInput.addEventListener('change', importData);

    // Theme toggle
    el.btnThemeToggle.addEventListener('click', toggleTheme);

    // Drag & Drop across days modal
    el.btnCloseDragDropModal.addEventListener('click', closeDragDropModal);
    el.btnCancelDragDrop.addEventListener('click', closeDragDropModal);
    el.btnChoiceCopyTask.addEventListener('click', handleConfirmCopyTask);
    el.btnChoiceCopyPending.addEventListener('click', handleConfirmCopyPending);
    el.btnChoiceMoveTask.addEventListener('click', handleConfirmMoveTask);

    // Close modals on clicking backdrop
    window.addEventListener('click', (e) => {
      if (e.target === el.dayModal) closeDayModal();
      if (e.target === el.editTaskModal) closeEditTaskModal();
      if (e.target === el.labelPickerModal) closeLabelPicker();
      if (e.target === el.backupModal) el.backupModal.classList.remove('active');
      if (e.target === el.dragDropActionModal) closeDragDropModal();
    });

    // Keyboard escape to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (el.labelPickerModal.classList.contains('active')) closeLabelPicker();
        else if (el.editTaskModal.classList.contains('active')) closeEditTaskModal();
        else if (el.dayModal.classList.contains('active')) closeDayModal();
        else if (el.backupModal.classList.contains('active')) el.backupModal.classList.remove('active');
        else if (el.dragDropActionModal.classList.contains('active')) closeDragDropModal();
      }
    });
  }

  // --- App Initialization ---
  function init() {
    loadFromStorage();
    applyTheme();
    initEventListeners();
    renderCalendar();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
