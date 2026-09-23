// --- Global State Variables ---
let jwtToken = null;
let currentUserId = 1; // Simplified for demo. In production, extract from JWT.
let loggedInUsername = "";
let allExpenses = [];      // Holds all data from the database
let filteredExpenses = []; // Holds the data currently visible based on filters
let expenseChartInstance = null;

// --- Utility Functions ---
const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

function getAuthHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` };
}

// --- Authentication & UI Toggles ---
function toggleAuth() {
    const login = document.getElementById('loginForm');
    const reg = document.getElementById('registerForm');
    document.getElementById('authMessage').innerText = "";
    
    if (login.style.display === 'none') {
        login.style.display = 'block';
        reg.style.display = 'none';
    } else {
        login.style.display = 'none';
        reg.style.display = 'block';
    }
}

function showMessage(elementId, msg, isError = false) {
    const el = document.getElementById(elementId);
    el.innerText = msg;
    el.className = `text-center mt-2 fw-bold ${isError ? 'text-danger' : 'text-success'}`;
}

async function register() {
    const user = document.getElementById('regUser').value;
    const pass = document.getElementById('regPass').value;
    if (!user || !pass) return showMessage('authMessage', 'Please fill all fields', true);

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass, role: 'USER' })
        });
        
        if (response.ok) {
            showMessage('authMessage', 'Registration successful! Please login.');
            setTimeout(toggleAuth, 1500);
        } else {
            showMessage('authMessage', 'Registration failed. Username may exist.', true);
        }
    } catch (e) { console.error("Gateway error:", e); }
}

async function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (!user || !pass) return showMessage('authMessage', 'Please fill all fields', true);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (response.ok) {
            jwtToken = await response.text(); 
            loggedInUsername = user;
            
            document.getElementById('welcomeUser').innerText = loggedInUsername;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            
            document.getElementById('date').valueAsDate = new Date(); // Pre-fill today's date
            loadExpenses();
        } else {
            showMessage('authMessage', 'Invalid username or password.', true);
        }
    } catch (e) { console.error("Gateway error:", e); }
}

function logout() {
    jwtToken = null;
    allExpenses = [];
    filteredExpenses = [];
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
}

// --- Core Data Loading ---
async function loadExpenses() {
    const response = await fetch(`/api/expenses/user/${currentUserId}`, { headers: getAuthHeaders() });
    if (response.ok) {
        allExpenses = await response.json();
        applyFilters(); // Apply the current filter (defaults to 'All Time') which calls updateUI()
    }
}

// Updates all visual components at once
function updateUI() {
    renderTable();
    calculateDashboard();
    updateChart();
}

// --- Date Filtering Logic ---
function toggleCustomDates() {
    const filter = document.getElementById('dateFilter').value;
    const customGroups = document.querySelectorAll('.custom-date-group');
    customGroups.forEach(el => el.style.display = filter === 'custom' ? 'block' : 'none');
}

function applyFilters() {
    const filter = document.getElementById('dateFilter').value;
    const now = new Date();
    
    if (filter === 'all') {
        filteredExpenses = [...allExpenses];
    } 
    else if (filter === 'thisMonth') {
        filteredExpenses = allExpenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
        });
    } 
    else if (filter === 'lastMonth') {
        filteredExpenses = allExpenses.filter(exp => {
            const expDate = new Date(exp.date);
            let lastMonth = now.getMonth() - 1;
            let year = now.getFullYear();
            if (lastMonth < 0) { lastMonth = 11; year--; }
            return expDate.getMonth() === lastMonth && expDate.getFullYear() === year;
        });
    } 
    else if (filter === 'custom') {
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        if (!start || !end) return alert("Please select both start and end dates.");
        
        filteredExpenses = allExpenses.filter(exp => exp.date >= start && exp.date <= end);
    }
    
    updateUI(); 
}

// --- UI Rendering ---
function renderTable() {
    const tbody = document.getElementById('expenseTableBody');
    tbody.innerHTML = '';
    
    // Sort by newest date first
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        const isIncome = exp.type === 'INCOME';
        const colorClass = isIncome ? 'text-success' : 'text-danger';
        const icon = isIncome ? '<i class="bi bi-arrow-down-left-circle"></i>' : '<i class="bi bi-arrow-up-right-circle"></i>';
        const desc = exp.description ? `<br><small class="text-muted">${exp.description}</small>` : '';

        tbody.innerHTML += `
            <tr>
                <td class="text-nowrap">${exp.date}</td>
                <td><strong>${exp.category}</strong>${desc}</td>
                <td><span class="${colorClass} fw-bold">${icon} ${exp.type}</span></td>
                <td class="fw-bold">${formatRupees(exp.amount)}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-light text-primary me-1" onclick="openEditModal(${exp.id})" title="Edit">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-light text-danger" onclick="deleteExpense(${exp.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function calculateDashboard() {
    let income = 0; 
    let expense = 0;
    
    // Calculate totals based ONLY on currently visible/filtered expenses
    filteredExpenses.forEach(exp => {
        if (exp.type === 'INCOME') income += exp.amount;
        if (exp.type === 'EXPENSE') expense += exp.amount;
    });

    document.getElementById('totalIncome').innerText = formatRupees(income);
    document.getElementById('totalExpense').innerText = formatRupees(expense);
    document.getElementById('totalBalance').innerText = formatRupees(income - expense);
}

function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Aggregate currently visible expenses by category
    const expenseData = {};
    filteredExpenses.filter(e => e.type === 'EXPENSE').forEach(exp => {
        expenseData[exp.category] = (expenseData[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (expenseChartInstance) expenseChartInstance.destroy();

    if (labels.length === 0) {
        expenseChartInstance = new Chart(ctx, { 
            type: 'doughnut', 
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#e9ecef'] }] }
        });
        return;
    }

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#ea868f', '#20c997']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// --- CRUD Operations ---
async function addExpense() {
    const data = {
        userId: currentUserId,
        date: document.getElementById('date').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        type: document.getElementById('type').value
    };

    await fetch(`/api/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    document.getElementById('addForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    loadExpenses(); // Reloads from DB and re-applies filters
}

async function deleteExpense(id) {
    if (confirm("Delete this transaction?")) {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        loadExpenses();
    }
}

function openEditModal(id) {
    const exp = allExpenses.find(e => e.id === id); // Find in total dataset
    if (!exp) return;
    
    document.getElementById('editId').value = exp.id;
    document.getElementById('editDate').value = exp.date;
    document.getElementById('editAmount').value = exp.amount;
    document.getElementById('editCategory').value = exp.category;
    document.getElementById('editDescription').value = exp.description || '';
    document.getElementById('editType').value = exp.type;
    
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() { 
    document.getElementById('editModal').style.display = 'none'; 
}

async function updateExpense() {
    const id = document.getElementById('editId').value;
    const data = {
        userId: currentUserId,
        date: document.getElementById('editDate').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        category: document.getElementById('editCategory').value,
        description: document.getElementById('editDescription').value,
        type: document.getElementById('editType').value
    };

    await fetch(`/api/expenses/${id}`, { 
        method: 'PUT', 
        headers: getAuthHeaders(), 
        body: JSON.stringify(data) 
    });
    
    closeEditModal();
    loadExpenses();
}

// --- Export Functionality ---
function exportToCSV() {
    if (filteredExpenses.length === 0) return alert("No data to export for this date range.");
    
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Category,Description,Amount (INR)\n";
    
    // Sort to make the CSV chronological
    [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(exp => {
        // Strip commas from description to prevent breaking the CSV formatting
        const desc = exp.description ? exp.description.replace(/,/g, "") : ""; 
        const row = `${exp.date},${exp.type},${exp.category},${desc},${exp.amount}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // Name the file based on the user and current date filter
    const filterText = document.getElementById('dateFilter').value;
    link.setAttribute("download", `FinTrack_${loggedInUsername}_${filterText}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}