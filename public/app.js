const state = {
  token: "",
  user: null,
  authMode: "login",
};

const elements = {
  dashboardShell: document.getElementById("dashboard-shell"),
  authTabs: document.getElementById("auth-tabs"),
  showLoginBtn: document.getElementById("show-login-btn"),
  showRegisterBtn: document.getElementById("show-register-btn"),
  loginForm: document.getElementById("login-form"),
  registerForm: document.getElementById("register-form"),
  logoutBtn: document.getElementById("logout-btn"),
  sessionCard: document.getElementById("session-card"),
  sessionName: document.getElementById("session-name"),
  sessionMeta: document.getElementById("session-meta"),
  roleTip: document.getElementById("role-tip"),
  errorBox: document.getElementById("error-box"),
  statusMessage: document.getElementById("status-message"),
  refreshDashboardBtn: document.getElementById("refresh-dashboard-btn"),
  refreshRecordsBtn: document.getElementById("refresh-records-btn"),
  refreshUsersBtn: document.getElementById("refresh-users-btn"),
  recordsPanel: document.getElementById("records-panel"),
  usersPanel: document.getElementById("users-panel"),
  recordFilters: document.getElementById("record-filters"),
  recordFormPanel: document.getElementById("record-form-panel"),
  recordForm: document.getElementById("record-form"),
  recordFormTitle: document.getElementById("record-form-title"),
  cancelRecordEditBtn: document.getElementById("cancel-record-edit-btn"),
  recordsTable: document.getElementById("records-table"),
  recordsMeta: document.getElementById("records-meta"),
  usersTable: document.getElementById("users-table"),
  userForm: document.getElementById("user-form"),
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function showError(message) {
  elements.errorBox.textContent = message;
  elements.errorBox.classList.remove("hidden");
}

function clearError() {
  elements.errorBox.textContent = "";
  elements.errorBox.classList.add("hidden");
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  if (response.status === 204) return null;

  const body = await response.json();
  if (!response.ok) {
    const detailMessage = Array.isArray(body.details)
      ? body.details.map((item) => item.message).join(", ")
      : body.error;
    throw new Error(detailMessage || "Request failed.");
  }

  return body;
}

function persistSession() {
  localStorage.setItem("financeDemoToken", state.token || "");
  localStorage.setItem("financeDemoUser", JSON.stringify(state.user || null));
}

function clearSession() {
  state.token = "";
  state.user = null;
  persistSession();
  renderSession();
}

function canReadRecords() {
  return state.user && (state.user.role === "analyst" || state.user.role === "admin");
}

function canManageRecords() {
  return state.user && state.user.role === "admin";
}

function canManageUsers() {
  return state.user && state.user.role === "admin";
}

function setAuthMode(mode) {
  state.authMode = mode;
  elements.showLoginBtn.classList.toggle("active", mode === "login");
  elements.showRegisterBtn.classList.toggle("active", mode === "register");
  elements.loginForm.classList.toggle("hidden", mode !== "login");
  elements.registerForm.classList.toggle("hidden", mode !== "register");
  clearError();
}

function renderSession() {
  const signedIn = Boolean(state.token && state.user);
  elements.sessionCard.classList.toggle("hidden", !signedIn);
  elements.dashboardShell.classList.toggle("hidden", !signedIn);
  elements.recordsPanel.classList.toggle("hidden", !canReadRecords());
  elements.usersPanel.classList.toggle("hidden", !canManageUsers());
  elements.recordFormPanel.classList.toggle("hidden", !canManageRecords());
  elements.authTabs.classList.toggle("hidden", signedIn);
  elements.loginForm.classList.toggle("hidden", signedIn || state.authMode !== "login");
  elements.registerForm.classList.toggle("hidden", signedIn || state.authMode !== "register");

  if (!signedIn) {
    elements.sessionName.textContent = "Not signed in";
    elements.sessionMeta.textContent = "";
    elements.roleTip.textContent = "";
    elements.roleTip.classList.add("hidden");
    setStatus("Sign in to load your dashboard.");
    elements.recordsTable.innerHTML = "";
    elements.usersTable.innerHTML = "";
    return;
  }

  elements.sessionName.textContent = state.user.name;
  elements.sessionMeta.textContent = `${state.user.email} | ${state.user.role} | ${state.user.status}`;
  elements.roleTip.classList.remove("hidden");
  elements.roleTip.textContent =
    state.user.role === "viewer"
      ? "Viewer mode: summary access only."
      : state.user.role === "analyst"
        ? "Analyst mode: read-only access to records and insights."
        : "Admin mode: full record and user management.";
  setStatus("Connected to the live backend. Changes persist to SQLite.");
}

function renderSummary(summary) {
  document.getElementById("income-total").textContent = currency.format(summary.totals.income);
  document.getElementById("expense-total").textContent = currency.format(summary.totals.expenses);
  document.getElementById("net-total").textContent = currency.format(summary.totals.netBalance);

  document.getElementById("recent-activity").innerHTML = summary.recentActivity.length
    ? summary.recentActivity.map((entry) => `
      <article class="list-item">
        <strong>${escapeHtml(entry.category)} <span class="${entry.type === "income" ? "positive" : "negative"}">${currency.format(entry.amount)}</span></strong>
        <div>${escapeHtml(entry.date)} | ${escapeHtml(entry.notes || "No notes")}</div>
      </article>`).join("")
    : "<p>No recent activity yet.</p>";

  document.getElementById("category-breakdown").innerHTML = summary.categoryBreakdown.length
    ? summary.categoryBreakdown.map((entry) => `
      <article class="list-item">
        <strong>${escapeHtml(entry.category)}</strong>
        <div>${escapeHtml(entry.type)} | ${currency.format(entry.total)}</div>
      </article>`).join("")
    : "<p>No category totals yet.</p>";

  document.getElementById("monthly-trends").innerHTML = summary.monthlyTrend.length
    ? `
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          ${summary.monthlyTrend.map((entry) => `
            <tr>
              <td>${escapeHtml(entry.month)}</td>
              <td>${currency.format(entry.income)}</td>
              <td>${currency.format(entry.expenses)}</td>
              <td class="${entry.netBalance >= 0 ? "positive" : "negative"}">${currency.format(entry.netBalance)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`
    : "<p>No monthly trend data yet.</p>";
}

function renderRecords(payload) {
  elements.recordsMeta.textContent = `Showing ${payload.data.length} of ${payload.meta.total} records. Page ${payload.meta.page} of ${payload.meta.totalPages}.`;

  if (!payload.data.length) {
    elements.recordsTable.innerHTML = "<p>No records matched the current filters.</p>";
    return;
  }

  const actionHeader = canManageRecords() ? "<th>Actions</th>" : "";
  const rows = payload.data.map((record) => {
    const actionCell = canManageRecords()
      ? `<td class="actions-cell">
          <button class="ghost-btn" type="button" data-action="edit-record" data-id="${record.id}">Edit</button>
          <button class="ghost-btn" type="button" data-action="delete-record" data-id="${record.id}">Delete</button>
        </td>`
      : "";

    return `<tr>
      <td>${currency.format(record.amount)}</td>
      <td><span class="badge type-${escapeHtml(record.type)}">${escapeHtml(record.type)}</span></td>
      <td>${escapeHtml(record.category)}</td>
      <td>${escapeHtml(record.date)}</td>
      <td>${escapeHtml(record.notes || "-")}</td>
      ${actionCell}
    </tr>`;
  }).join("");

  elements.recordsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Amount</th>
          <th>Type</th>
          <th>Category</th>
          <th>Date</th>
          <th>Notes</th>
          ${actionHeader}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderUsers(users) {
  if (!users.length) {
    elements.usersTable.innerHTML = "<p>No users found.</p>";
    return;
  }

  elements.usersTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((user) => `
          <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge role-${escapeHtml(user.role)}">${escapeHtml(user.role)}</span></td>
            <td><span class="badge status-${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function resetRecordForm() {
  elements.recordForm.reset();
  document.getElementById("record-id").value = "";
  elements.recordFormTitle.textContent = "Create Record";
  document.getElementById("record-date").value = new Date().toISOString().slice(0, 10);
}

async function loadSummary() {
  if (!state.user) return;
  const response = await api("/api/dashboard/summary");
  renderSummary(response.data);
}

async function loadRecords() {
  if (!canReadRecords()) return;

  const formData = new FormData(elements.recordFilters);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (String(value).trim()) params.set(key, String(value));
  }
  params.set("page", "1");
  params.set("pageSize", "10");

  const response = await api(`/api/records?${params.toString()}`);
  renderRecords(response);
}

async function loadUsers() {
  if (!canManageUsers()) return;
  const response = await api("/api/users");
  renderUsers(response.data);
}

async function loadAllData() {
  clearError();
  try {
    await loadSummary();
    if (canReadRecords()) await loadRecords();
    if (canManageUsers()) await loadUsers();
  } catch (error) {
    showError(error.message);
  }
}

elements.showLoginBtn.addEventListener("click", () => setAuthMode("login"));
elements.showRegisterBtn.addEventListener("click", () => setAuthMode("register"));

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  try {
    const response = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value,
      }),
    });
    state.token = response.token;
    state.user = response.user;
    persistSession();
    renderSession();
    await loadAllData();
  } catch (error) {
    showError(error.message);
  }
});

elements.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  try {
    const response = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("register-name").value.trim(),
        email: document.getElementById("register-email").value.trim(),
        password: document.getElementById("register-password").value,
        role: document.getElementById("register-role").value,
      }),
    });
    state.token = response.token;
    state.user = response.user;
    persistSession();
    renderSession();
    await loadAllData();
  } catch (error) {
    showError(error.message);
  }
});

elements.logoutBtn.addEventListener("click", () => {
  clearError();
  clearSession();
});

elements.refreshDashboardBtn.addEventListener("click", () => loadAllData());
elements.refreshRecordsBtn.addEventListener("click", () => loadRecords().catch((error) => showError(error.message)));
elements.refreshUsersBtn.addEventListener("click", () => loadUsers().catch((error) => showError(error.message)));

elements.recordFilters.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  try {
    await loadRecords();
  } catch (error) {
    showError(error.message);
  }
});

elements.recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const id = document.getElementById("record-id").value;
  const payload = {
    amount: Number(document.getElementById("record-amount").value),
    type: document.getElementById("record-type").value,
    category: document.getElementById("record-category").value.trim(),
    date: document.getElementById("record-date").value,
    notes: document.getElementById("record-notes").value.trim(),
  };

  try {
    await api(id ? `/api/records/${id}` : "/api/records", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    resetRecordForm();
    await loadAllData();
  } catch (error) {
    showError(error.message);
  }
});

elements.cancelRecordEditBtn.addEventListener("click", () => resetRecordForm());

elements.recordsTable.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  clearError();

  try {
    if (action === "delete-record") {
      if (!window.confirm("Delete this record?")) return;
      await api(`/api/records/${id}`, { method: "DELETE" });
      await loadAllData();
      return;
    }

    if (action === "edit-record") {
      const response = await api(`/api/records/${id}`);
      const record = response.data;
      document.getElementById("record-id").value = String(record.id);
      document.getElementById("record-amount").value = String(record.amount);
      document.getElementById("record-type").value = record.type;
      document.getElementById("record-category").value = record.category;
      document.getElementById("record-date").value = record.date;
      document.getElementById("record-notes").value = record.notes || "";
      elements.recordFormTitle.textContent = `Edit Record #${record.id}`;
      elements.recordFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    showError(error.message);
  }
});

elements.userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  try {
    await api("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("user-name").value.trim(),
        email: document.getElementById("user-email").value.trim(),
        password: document.getElementById("user-password").value,
        role: document.getElementById("user-role").value,
        status: document.getElementById("user-status").value,
      }),
    });
    elements.userForm.reset();
    await loadUsers();
  } catch (error) {
    showError(error.message);
  }
});

async function bootstrap() {
  setAuthMode("login");
  localStorage.removeItem("financeDemoToken");
  localStorage.removeItem("financeDemoUser");
  renderSession();
  resetRecordForm();
}

bootstrap();
