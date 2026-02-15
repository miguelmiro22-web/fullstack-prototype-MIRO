const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;

window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

//Phase 4: Data persistence
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            window.db = JSON.parse(data);
        } else {
            window.db = {
                accounts: [
                    {
                        id: 1,
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@example.com',
                        password: 'Password123!',
                        role: 'admin',
                        verified: true
                    }
                ],
                departments: [
                    { id: 1, name: 'Engineering', description: 'Software Development' },
                    { id: 2, name: 'HR', description: 'Human Resources' }
                ],
                employees: [],
                requests: []
            };
            saveToStorage();
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        window.db = {
            accounts: [
                {
                    id: 1,
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@example.com',
                    password: 'Password123!',
                    role: 'admin',
                    verified: true
                }
            ],
            departments: [
                { id: 1, name: 'Engineering', description: 'Software Development' },
                { id: 2, name: 'HR', description: 'Human Resources' }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

//Phase 2: Client side and routing
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || '#/';
    const page = hash.substring(2) || 'home';
    
    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'accounts', 'departments'];
    
    if (protectedRoutes.includes(page) && !currentUser) {
        showToast('Please login to access this page', 'warning');
        navigateTo('#/login');
        return;
    }
    
    if (adminRoutes.includes(page) && (!currentUser || currentUser.role !== 'admin')) {
        showToast('Access denied. Admin privileges required.', 'danger');
        navigateTo('#/');
        return;
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        if (page === 'profile') {
            renderProfile();
        } else if (page === 'accounts') {
            renderAccountsList();
        } else if (page === 'departments') {
            renderDepartmentsList();
        } else if (page === 'employees') {
            renderEmployeesList();
        } else if (page === 'requests') {
            renderRequestsList();
        }
    } else {
        navigateTo('#/');
    }
}

//Phase 3: Authentication system
function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        document.getElementById('username-display').textContent = user.firstName;
        
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        currentUser = null;
    }
}

function checkAuthOnLoad() {
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        const user = window.db.accounts.find(acc => acc.email === authToken && acc.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
}

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('reg-firstname').value;
    const lastName = document.getElementById('reg-lastname').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    const existingUser = window.db.accounts.find(acc => acc.email === email);
    if (existingUser) {
        showToast('Email already exists!', 'danger');
        return;
    }
    
    const newAccount = {
        id: window.db.accounts.length + 1,
        firstName,
        lastName,
        email,
        password,
        role: 'user',
        verified: false
    };
    
    window.db.accounts.push(newAccount);
    saveToStorage();
    
    localStorage.setItem('unverified_email', email);
    document.getElementById('verify-email-display').textContent = email;
    navigateTo('#/verify-email');
    showToast('Registration successful! Please verify your email.', 'success');
});

document.getElementById('simulate-verify-btn').addEventListener('click', function() {
    const email = localStorage.getItem('unverified_email');
    
    if (!email) {
        showToast('No pending verification found', 'warning');
        return;
    }
    
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        showToast('Email verified successfully! You can now login.', 'success');
        navigateTo('#/login');
    }
});

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    const account = window.db.accounts.find(acc => 
        acc.email === email && 
        acc.password === password && 
        acc.verified === true
    );
    
    if (account) {
        localStorage.setItem('auth_token', email);
        setAuthState(true, account);
        errorDiv.classList.add('d-none');
        showToast('Login successful!', 'success');
        navigateTo('#/profile');
        document.getElementById('login-form').reset();
    } else {
        errorDiv.textContent = 'Invalid email/password or account not verified';
        errorDiv.classList.remove('d-none');
    }
});

document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    setAuthState(false);
    showToast('Logged out successfully', 'success');
    navigateTo('#/');
});

//Phase 5: Profile page
function renderProfile() {
    if (!currentUser) return;
    
    const content = `
        <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> <span class="badge bg-${currentUser.role === 'admin' ? 'danger' : 'primary'}">${currentUser.role}</span></p>
        <button class="btn btn-secondary" onclick="alert('Edit profile feature coming soon!')">Edit Profile</button>
    `;
    
    document.getElementById('profile-content').innerHTML = content;
}

//Phase 6: Admin features - Accounts
function renderAccountsList() {
    const container = document.getElementById('accounts-list');
    
    let html = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    window.db.accounts.forEach(acc => {
        html += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td><span class="badge bg-${acc.role === 'admin' ? 'danger' : 'primary'}">${acc.role}</span></td>
                <td>${acc.verified ? '✓' : '—'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editAccount(${acc.id})">Edit</button>
                    <button class="btn btn-sm btn-info" onclick="resetPassword(${acc.id})">Reset PW</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${acc.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

document.getElementById('add-account-btn').addEventListener('click', function() {
    showAccountModal();
});

function showAccountModal(accountId = null) {
    const account = accountId ? window.db.accounts.find(a => a.id === accountId) : null;
    const isEdit = !!account;
    
    const modalHtml = `
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="account-form">
                            <div class="mb-3">
                                <label class="form-label">First Name</label>
                                <input type="text" class="form-control" id="acc-firstname" value="${account?.firstName || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="acc-lastname" value="${account?.lastName || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="acc-email" value="${account?.email || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password ${isEdit ? '(leave blank to keep current)' : ''}</label>
                                <input type="password" class="form-control" id="acc-password" ${!isEdit ? 'required' : ''} minlength="6">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Role</label>
                                <select class="form-select" id="acc-role">
                                    <option value="user" ${account?.role === 'user' ? 'selected' : ''}>User</option>
                                    <option value="admin" ${account?.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="acc-verified" ${account?.verified ? 'checked' : ''}>
                                <label class="form-check-label" for="acc-verified">Verified</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAccount(${accountId})">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHtml;
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function saveAccount(accountId) {
    const firstName = document.getElementById('acc-firstname').value;
    const lastName = document.getElementById('acc-lastname').value;
    const email = document.getElementById('acc-email').value;
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value;
    const verified = document.getElementById('acc-verified').checked;
    
    if (accountId) {
        const account = window.db.accounts.find(a => a.id === accountId);
        account.firstName = firstName;
        account.lastName = lastName;
        account.email = email;
        if (password) account.password = password;
        account.role = role;
        account.verified = verified;
        showToast('Account updated successfully', 'success');
    } else {
        const newAccount = {
            id: Math.max(...window.db.accounts.map(a => a.id), 0) + 1,
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        };
        window.db.accounts.push(newAccount);
        showToast('Account created successfully', 'success');
    }
    
    saveToStorage();
    renderAccountsList();
    bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
}

function editAccount(accountId) {
    showAccountModal(accountId);
}

function resetPassword(accountId) {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (newPassword && newPassword.length >= 6) {
        const account = window.db.accounts.find(a => a.id === accountId);
        account.password = newPassword;
        saveToStorage();
        showToast('Password reset successfully', 'success');
    } else if (newPassword) {
        showToast('Password must be at least 6 characters', 'danger');
    }
}

function deleteAccount(accountId) {
    if (currentUser && currentUser.id === accountId) {
        showToast('You cannot delete your own account', 'danger');
        return;
    }
    
    if (confirm('Are you sure you want to delete this account?')) {
        window.db.accounts = window.db.accounts.filter(a => a.id !== accountId);
        saveToStorage();
        renderAccountsList();
        showToast('Account deleted successfully', 'success');
    }
}

//Phase 6: Admin features - Departments
function renderDepartmentsList() {
    const container = document.getElementById('departments-list');
    
    let html = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    window.db.departments.forEach(dept => {
        html += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editDepartment(${dept.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

document.getElementById('add-department-btn').addEventListener('click', function() {
    showDepartmentModal();
});

function showDepartmentModal(deptId = null) {
    const dept = deptId ? window.db.departments.find(d => d.id === deptId) : null;
    const isEdit = !!dept;
    
    const modalHtml = `
        <div class="modal fade" id="deptModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="dept-form">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" id="dept-name" value="${dept?.name || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="dept-description" rows="3" required>${dept?.description || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDepartment(${deptId})">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHtml;
    const modal = new bootstrap.Modal(document.getElementById('deptModal'));
    modal.show();
}

function saveDepartment(deptId) {
    const name = document.getElementById('dept-name').value;
    const description = document.getElementById('dept-description').value;
    
    if (deptId) {
        const dept = window.db.departments.find(d => d.id === deptId);
        dept.name = name;
        dept.description = description;
        showToast('Department updated successfully', 'success');
    } else {
        const newDept = {
            id: Math.max(...window.db.departments.map(d => d.id), 0) + 1,
            name,
            description
        };
        window.db.departments.push(newDept);
        showToast('Department created successfully', 'success');
    }
    
    saveToStorage();
    renderDepartmentsList();
    bootstrap.Modal.getInstance(document.getElementById('deptModal')).hide();
}

function editDepartment(deptId) {
    showDepartmentModal(deptId);
}

function deleteDepartment(deptId) {
    if (confirm('Are you sure you want to delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== deptId);
        saveToStorage();
        renderDepartmentsList();
        showToast('Department deleted successfully', 'success');
    }
}

//Phase 6: Admin features - Employees
function renderEmployeesList() {
    const container = document.getElementById('employees-list');
    
    let html = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    window.db.employees.forEach(emp => {
        const user = window.db.accounts.find(a => a.id === emp.userId);
        const dept = window.db.departments.find(d => d.id === emp.departmentId);
        
        html += `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${user ? user.email : 'N/A'}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td>${emp.hireDate}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editEmployee(${emp.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

document.getElementById('add-employee-btn').addEventListener('click', function() {
    showEmployeeModal();
});

function showEmployeeModal(empId = null) {
    const emp = empId ? window.db.employees.find(e => e.id === empId) : null;
    const isEdit = !!emp;
    
    let userOptions = '<option value="">Select User</option>';
    window.db.accounts.forEach(acc => {
        userOptions += `<option value="${acc.id}" ${emp?.userId === acc.id ? 'selected' : ''}>${acc.email}</option>`;
    });
    
    let deptOptions = '<option value="">Select Department</option>';
    window.db.departments.forEach(dept => {
        deptOptions += `<option value="${dept.id}" ${emp?.departmentId === dept.id ? 'selected' : ''}>${dept.name}</option>`;
    });
    
    const modalHtml = `
        <div class="modal fade" id="employeeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit' : 'Add'} Employee</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="employee-form">
                            <div class="mb-3">
                                <label class="form-label">Employee ID</label>
                                <input type="text" class="form-control" id="emp-id" value="${emp?.employeeId || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">User Email</label>
                                <select class="form-select" id="emp-user" required>
                                    ${userOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Position</label>
                                <input type="text" class="form-control" id="emp-position" value="${emp?.position || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Department</label>
                                <select class="form-select" id="emp-dept" required>
                                    ${deptOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Hire Date</label>
                                <input type="date" class="form-control" id="emp-hiredate" value="${emp?.hireDate || ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveEmployee(${empId})">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHtml;
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

function saveEmployee(empId) {
    const employeeId = document.getElementById('emp-id').value;
    const userId = parseInt(document.getElementById('emp-user').value);
    const position = document.getElementById('emp-position').value;
    const departmentId = parseInt(document.getElementById('emp-dept').value);
    const hireDate = document.getElementById('emp-hiredate').value;
    
    if (!userId || !departmentId) {
        showToast('Please select user and department', 'danger');
        return;
    }
    
    if (empId) {
        const employee = window.db.employees.find(e => e.id === empId);
        employee.employeeId = employeeId;
        employee.userId = userId;
        employee.position = position;
        employee.departmentId = departmentId;
        employee.hireDate = hireDate;
        showToast('Employee updated successfully', 'success');
    } else {
        const newEmployee = {
            id: Math.max(...window.db.employees.map(e => e.id), 0) + 1,
            employeeId,
            userId,
            position,
            departmentId,
            hireDate
        };
        window.db.employees.push(newEmployee);
        showToast('Employee created successfully', 'success');
    }
    
    saveToStorage();
    renderEmployeesList();
    bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
}

function editEmployee(empId) {
    showEmployeeModal(empId);
}

function deleteEmployee(empId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== empId);
        saveToStorage();
        renderEmployeesList();
        showToast('Employee deleted successfully', 'success');
    }
}

//Phase 7: User requests
function renderRequestsList() {
    const container = document.getElementById('requests-list');
    
    // For admin: show ALL requests. For users: show only their requests
    const userRequests = currentUser.role === 'admin' 
        ? window.db.requests 
        : window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        container.innerHTML = '<p class="text-muted">No requests yet.</p>';
        return;
    }
    
    let html = `
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    ${currentUser.role === 'admin' ? '<th>Employee</th>' : ''}
                    <th>Type</th>
                    <th>Items</th>
                    <th>Status</th>
                    ${currentUser.role === 'admin' ? '<th>Actions</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;
    
    userRequests.forEach(req => {
        const statusClass = req.status === 'Pending' ? 'warning' : req.status === 'Approved' ? 'success' : 'danger';
        const itemsList = req.items.map(item => `${item.name} (${item.quantity})`).join(', ');
        
        html += `
            <tr>
                <td>${req.date}</td>
                ${currentUser.role === 'admin' ? `<td>${req.employeeEmail}</td>` : ''}
                <td>${req.type}</td>
                <td>${itemsList}</td>
                <td><span class="badge bg-${statusClass}">${req.status}</span></td>
                ${currentUser.role === 'admin' ? `
                    <td>
                        ${req.status === 'Pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateRequestStatus(${req.id}, 'Approved')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="updateRequestStatus(${req.id}, 'Rejected')">Reject</button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteRequest(${req.id})">Delete</button>
                    </td>
                ` : ''}
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

document.getElementById('new-request-btn').addEventListener('click', function() {
    showRequestModal();
});

function showRequestModal() {
    const modalHtml = `
        <div class="modal fade" id="requestModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="request-form">
                            <div class="mb-3">
                                <label class="form-label">Request Type</label>
                                <select class="form-select" id="req-type" required>
                                    <option value="">Select Type</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Resources">Resources</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Items</label>
                                <div id="items-container">
                                    <div class="input-group mb-2 item-row">
                                        <input type="text" class="form-control item-name" placeholder="Item name" required>
                                        <input type="number" class="form-control item-qty" placeholder="Qty" min="1" required>
                                        <button type="button" class="btn btn-danger remove-item" onclick="removeItem(this)" style="display:none;">×</button>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-secondary" onclick="addItemField()">+ Add Item</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveRequest()">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-container').innerHTML = modalHtml;
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
}

function addItemField() {
    const container = document.getElementById('items-container');
    const itemRow = document.createElement('div');
    itemRow.className = 'input-group mb-2 item-row';
    itemRow.innerHTML = `
        <input type="text" class="form-control item-name" placeholder="Item name" required>
        <input type="number" class="form-control item-qty" placeholder="Qty" min="1" required>
        <button type="button" class="btn btn-danger remove-item" onclick="removeItem(this)">×</button>
    `;
    container.appendChild(itemRow);
    
    const firstRemoveBtn = container.querySelector('.item-row:first-child .remove-item');
    if (firstRemoveBtn) {
        firstRemoveBtn.style.display = 'block';
    }
}

function removeItem(button) {
    const container = document.getElementById('items-container');
    const itemRow = button.closest('.item-row');
    itemRow.remove();
    
    const itemRows = container.querySelectorAll('.item-row');
    if (itemRows.length === 1) {
        const firstRemoveBtn = container.querySelector('.item-row:first-child .remove-item');
        if (firstRemoveBtn) {
            firstRemoveBtn.style.display = 'none';
        }
    }
}

function saveRequest() {
    const type = document.getElementById('req-type').value;
    const itemRows = document.querySelectorAll('.item-row');
    
    if (!type) {
        showToast('Please select a request type', 'danger');
        return;
    }
    
    const items = [];
    let valid = true;
    
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = row.querySelector('.item-qty').value;
        
        if (name && quantity) {
            items.push({ name, quantity: parseInt(quantity) });
        } else {
            valid = false;
        }
    });
    
    if (!valid || items.length === 0) {
        showToast('Please fill in all item fields', 'danger');
        return;
    }
    
    const newRequest = {
        id: Math.max(...window.db.requests.map(r => r.id), 0) + 1,
        type,
        items,
        status: 'Pending',
        date: new Date().toLocaleDateString(),
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    renderRequestsList();
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    showToast('Request submitted successfully', 'success');
}

//Utility functions
function showToast(message, type = 'info') {
    const toastElement = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toastElement.className = `toast bg-${type} text-white`;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function updateRequestStatus(requestId, newStatus) {
    if (currentUser.role !== 'admin') {
        showToast('Access denied', 'danger');
        return;
    }
    
    const request = window.db.requests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        saveToStorage();
        renderRequestsList();
        showToast(`Request ${newStatus.toLowerCase()} successfully`, 'success');
    }
}

// Delete request (admin only)
// Update request status (admin only)
function updateRequestStatus(requestId, newStatus) {
    if (currentUser.role !== 'admin') {
        showToast('Access denied', 'danger');
        return;
    }
    
    const request = window.db.requests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        saveToStorage();
        renderRequestsList();
        showToast(`Request ${newStatus.toLowerCase()} successfully`, 'success');
    }
}

// Delete request (admin only)
function deleteRequest(requestId) {
    if (currentUser.role !== 'admin') {
        showToast('Access denied', 'danger');
        return;
    }
    
    if (confirm('Are you sure you want to delete this request?')) {
        window.db.requests = window.db.requests.filter(r => r.id !== requestId);
        saveToStorage();
        renderRequestsList();
        showToast('Request deleted successfully', 'success');
    }
}

//Initialization
loadFromStorage();
checkAuthOnLoad();
window.addEventListener('hashchange', handleRouting);

if (!window.location.hash) {
    window.location.hash = '#/';
}
handleRouting();

console.log('App initialized successfully!');