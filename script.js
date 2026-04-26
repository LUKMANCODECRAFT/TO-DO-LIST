/**
 * TaskMaster Pro - High-Performance Task Management Application
 * Architecture: Modular ES6+ Class-based with state management
 */

// --- Configuration & Constants ---
const CONFIG = {
  STORAGE_KEY: 'taskmaster_data_v2',
  THEME_KEY: 'taskmaster_theme',
  VERSION: '2.0.0',
  ANIMATION_DURATION: 300
};

const PRIORITIES = {
  high: { value: 'high', label: 'High', color: '#ef4444' },
  medium: { value: 'medium', label: 'Medium', color: '#f59e0b' },
  low: { value: 'low', label: 'Low', color: '#10b981' }
};

const CATEGORIES = {
  personal: { value: 'personal', label: 'Personal', color: '#8b5cf6' },
  work: { value: 'work', label: 'Work', color: '#3b82f6' },
  urgent: { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  health: { value: 'health', label: 'Health', color: '#10b981' },
  learning: { value: 'learning', label: 'Learning', color: '#f59e0b' }
};

// --- Utility Functions ---
const utils = {
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  
  formatDate: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Overdue ${date.toLocaleDateString('en-US', {month:'short', day:'numeric'})}`, urgent: true };
    if (diffDays === 0) return { text: 'Today', soon: true };
    if (diffDays === 1) return { text: 'Tomorrow', soon: true };
    return { text: date.toLocaleDateString('en-US', {month:'short', day:'numeric'}), urgent: false, soon: false };
  },
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// --- Confetti Effect ---
class ConfettiSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.isActive = false;
  }
  
  init() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  explode(x, y) {
    this.init();
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 4,
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
    if (!this.isActive) {
      this.isActive = true;
      this.animate();
    }
  }
  
  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= p.decay;
      
      if (p.life > 0) {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
        return true;
      }
      return false;
    });
    
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.isActive = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// --- Toast Notification System ---
class ToastSystem {
  constructor() {
    this.container = null;
    this.init();
  }
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${utils.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close notification">\u00D7</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(toast));
    
    this.container.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.animation = 'toastIn 0.3s ease';
    });
    
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
  }
  
  dismiss(toast) {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }
}

// --- Main Application Class ---
class TaskMasterApp {
  constructor() {
    this.tasks = [];
    this.filter = 'all';
    this.sortBy = 'newest';
    this.searchQuery = '';
    this.confetti = new ConfettiSystem();
    this.toast = new ToastSystem();
    
    this.cacheDOM();
    this.loadData();
    this.loadTheme();
    this.bindEvents();
    this.render();
  }
  
  cacheDOM() {
    this.dom = {
      taskForm: document.getElementById('task-form'),
      taskInput: document.getElementById('task-input'),
      taskPriority: document.getElementById('task-priority'),
      taskCategory: document.getElementById('task-category'),
      taskDue: document.getElementById('task-due'),
      taskList: document.getElementById('task-list'),
      emptyState: document.getElementById('empty-state'),
      searchInput: document.getElementById('search-input'),
      sortSelect: document.getElementById('sort-select'),
      filterTabs: document.querySelectorAll('.filter-tab'),
      progressCircle: document.getElementById('progress-circle'),
      progressPercent: document.getElementById('progress-percent'),
      totalTasks: document.getElementById('total-tasks'),
      activeTasks: document.getElementById('active-tasks'),
      completedTasks: document.getElementById('completed-tasks'),
      overdueTasks: document.getElementById('overdue-tasks'),
      themeToggle: document.getElementById('theme-toggle'),
      editModal: document.getElementById('edit-modal'),
      editForm: document.getElementById('edit-form'),
      editId: document.getElementById('edit-id'),
      editText: document.getElementById('edit-text'),
      editPriority: document.getElementById('edit-priority'),
      editCategory: document.getElementById('edit-category'),
      editDue: document.getElementById('edit-due'),
      modalClose: document.querySelector('.modal-close'),
      modalOverlay: document.querySelector('.modal-overlay'),
      btnCancel: document.querySelector('.btn-cancel')
    };
  }
  
  loadData() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data && Array.isArray(data.tasks)) {
          this.tasks = data.tasks;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
      this.tasks = [];
    }
  }
  
  saveData() {
    try {
      const data = { version: CONFIG.VERSION, tasks: this.tasks };
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  }
  
  loadTheme() {
    const theme = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(CONFIG.THEME_KEY, next);
  }
  
  bindEvents() {
    // Add task
    this.dom.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });
    
    // Search
    this.dom.searchInput.addEventListener('input', utils.debounce(() => {
      this.searchQuery = this.dom.searchInput.value.trim().toLowerCase();
      this.render();
    }, 250));
    
    // Sort
    this.dom.sortSelect.addEventListener('change', () => {
      this.sortBy = this.dom.sortSelect.value;
      this.render();
    });
    
    // Filter tabs
    this.dom.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filter = tab.dataset.filter;
        this.render();
      });
    });
    
    // Theme toggle
    this.dom.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Task list actions (event delegation)
    this.dom.taskList.addEventListener('click', (e) => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = item.dataset.id;
      
      if (e.target.classList.contains('task-checkbox')) {
        this.toggleComplete(id, e.target.checked);
      } else if (e.target.closest('.btn-edit')) {
        this.openEditModal(id);
      } else if (e.target.closest('.btn-delete')) {
        this.deleteTask(id, item);
      }
    });
    
    // Edit modal
    this.dom.editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEdit();
    });
    
    this.dom.modalClose.addEventListener('click', () => this.closeEditModal());
    this.dom.modalOverlay.addEventListener('click', () => this.closeEditModal());
    this.dom.btnCancel.addEventListener('click', () => this.closeEditModal());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.dom.editModal.hidden) {
        this.closeEditModal();
      }
    });
  }
  
  addTask() {
    const text = this.dom.taskInput.value.trim();
    if (!text) return;
    
    const task = {
      id: utils.generateId(),
      text: text,
      completed: false,
      priority: this.dom.taskPriority.value,
      category: this.dom.taskCategory.value,
      dueDate: this.dom.taskDue.value,
      createdAt: Date.now()
    };
    
    this.tasks.unshift(task);
    this.saveData();
    this.render();
    
    this.dom.taskInput.value = '';
    this.dom.taskPriority.value = 'medium';
    this.dom.taskCategory.value = 'personal';
    this.dom.taskDue.value = '';
    
    this.toast.show('Task added successfully!', 'success');
  }
  
  toggleComplete(id, completed) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = completed;
    this.saveData();
    this.render();
    
    if (completed) {
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        this.confetti.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      this.toast.show('Task completed! Great job!', 'success');
    }
  }
  
  deleteTask(id, element) {
    element.classList.add('removing');
    setTimeout(() => {
      this.tasks = this.tasks.filter(t => t.id !== id);
      this.saveData();
      this.render();
      this.toast.show('Task deleted', 'info');
    }, 300);
  }
  
  openEditModal(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    
    this.dom.editId.value = task.id;
    this.dom.editText.value = task.text;
    this.dom.editPriority.value = task.priority;
    this.dom.editCategory.value = task.category;
    this.dom.editDue.value = task.dueDate || '';
    
    this.dom.editModal.hidden = false;
    setTimeout(() => this.dom.editText.focus(), 100);
  }
  
  closeEditModal() {
    this.dom.editModal.hidden = true;
  }
  
  saveEdit() {
    const id = this.dom.editId.value;
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    
    task.text = this.dom.editText.value.trim();
    task.priority = this.dom.editPriority.value;
    task.category = this.dom.editCategory.value;
    task.dueDate = this.dom.editDue.value || null;
    
    this.saveData();
    this.render();
    this.closeEditModal();
    this.toast.show('Task updated successfully!', 'success');
  }
  
  getFilteredTasks() {
    let result = [...this.tasks];
    
    // Filter by status
    if (this.filter === 'active') {
      result = result.filter(t => !t.completed);
    } else if (this.filter === 'completed') {
      result = result.filter(t => t.completed);
    }
    
    // Search
    if (this.searchQuery) {
      result = result.filter(t => t.text.toLowerCase().includes(this.searchQuery));
    }
    
    // Sort
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'oldest': return a.createdAt - b.createdAt;
        case 'priority': {
          const pMap = { high: 3, medium: 2, low: 1 };
          return pMap[b.priority] - pMap[a.priority];
        }
        case 'due-date': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        default: return b.createdAt - a.createdAt; // newest
      }
    });
    
    return result;
  }
  
  getOverdueCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.tasks.filter(t => {
      if (t.completed || !t.dueDate) return false;
      const due = new Date(t.dueDate + 'T00:00:00');
      return due < today;
    }).length;
  }
  
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const overdue = this.getOverdueCount();
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    this.dom.totalTasks.textContent = total;
    this.dom.activeTasks.textContent = active;
    this.dom.completedTasks.textContent = completed;
    this.dom.overdueTasks.textContent = overdue;
    this.dom.progressPercent.textContent = percent + '%';
    
    // Update progress ring
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;
    this.dom.progressCircle.style.strokeDashoffset = offset;
  }
  
  render() {
    const filtered = this.getFilteredTasks();
    
    // Update empty state
    if (filtered.length === 0) {
      this.dom.taskList.innerHTML = '';
      this.dom.emptyState.style.display = 'block';
    } else {
      this.dom.emptyState.style.display = 'none';
      this.dom.taskList.innerHTML = filtered.map(task => this.renderTask(task)).join('');
    }
    
    this.updateStats();
  }
  
  renderTask(task) {
    const priority = PRIORITIES[task.priority] || PRIORITIES.medium;
    const category = CATEGORIES[task.category] || CATEGORIES.personal;
    const dueInfo = utils.formatDate(task.dueDate);
    
    let dueBadge = '';
    if (dueInfo.text) {
      const dueClass = dueInfo.urgent ? 'badge-due' : (dueInfo.soon ? 'badge-due-soon' : '');
      dueBadge = `<span class="task-badge ${dueClass}">${dueInfo.text}</span>`;
    }
    
    return `
      <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" role="listitem">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark as ${task.completed ? 'incomplete' : 'complete'}" />
        <div class="task-content">
          <div class="task-text">${utils.escapeHtml(task.text)}</div>
          <div class="task-meta">
            <span class="task-badge badge-priority-${task.priority}">${priority.label}</span>
            <span class="task-badge badge-category-${task.category}">${category.label}</span>
            ${dueBadge}
          </div>
        <div class="task-actions">
          <button class="task-btn btn-edit" aria-label="Edit task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="task-btn btn-delete" aria-label="Delete task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </li>
    `;
  }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  new TaskMasterApp();
});
