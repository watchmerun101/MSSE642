const log = document.querySelector('#log');
const resultNodes = {
  insecure: document.querySelector('[data-result="insecure"]'),
  secure: document.querySelector('[data-result="secure"]')
};

const records = [
  { id: 101, ownerId: 1, summary: 'Payroll export: April' },
  { id: 102, ownerId: 2, summary: 'Benefits adjustment request' },
  { id: 103, ownerId: 3, summary: 'Legal incident notes' }
];

const state = {
  insecureRoleMap: {
    1: 'admin',
    2: 'user',
    3: 'user'
  }
};

function addEntry(title, detail, tone = 'neutral') {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<strong class="${tone === 'danger' ? 'status-danger' : tone === 'safe' ? 'status-safe' : ''}">${title}</strong><br>${detail}`;
  log.prepend(entry);
}

function setResult(mode, message, tone) {
  resultNodes[mode].innerHTML = `<span class="${tone === 'danger' ? 'status-danger' : tone === 'safe' ? 'status-safe' : ''}">${message}</span>`;
}

function getRecord(recordId) {
  return records.find((record) => record.id === recordId);
}

function insecureRunCheck(role, actorId, recordId) {
  const record = getRecord(recordId);

  if (!record) {
    setResult('insecure', `Record ${recordId} not found. No access guard exists, so enumeration is still possible.`, 'danger');
    addEntry('Enumeration risk', `The insecure flow reveals that record ${recordId} does not exist, helping attackers map valid IDs.`, 'danger');
    return;
  }

  const roleUsed = state.insecureRoleMap[actorId] || role;
  setResult('insecure', `Access granted to record ${record.id} (${record.summary}) with role ${roleUsed}. Ownership was never checked.`, 'danger');
  addEntry('Unauthorized read allowed', `Actor ${actorId} read record ${record.id} owned by user ${record.ownerId} because the check trusts client input only.`, 'danger');
}

function secureRunCheck(role, actorId, recordId) {
  const record = getRecord(recordId);

  if (!record) {
    setResult('secure', `Request denied. Record ${recordId} is unavailable. Response is minimized to reduce object ID probing.`, 'safe');
    addEntry('Secure object handling', `The secure flow avoided exposing extra details for non-existing record ${recordId}.`, 'safe');
    return;
  }

  const isAdmin = role === 'admin';
  const isOwner = record.ownerId === actorId;

  if (!isAdmin && !isOwner) {
    setResult('secure', `Access denied for user ${actorId}. Record ${record.id} belongs to user ${record.ownerId}.`, 'safe');
    addEntry('IDOR blocked', `The secure flow denied unauthorized read of record ${record.id} for actor ${actorId}.`, 'safe');
    return;
  }

  setResult('secure', `Access granted to record ${record.id} (${record.summary}). Authorization succeeded via ${isAdmin ? 'admin role' : 'resource ownership'}.`, 'safe');
  addEntry('Authorized read only', `Actor ${actorId} viewed record ${record.id} with valid authorization (${isAdmin ? 'admin' : 'owner'}).`, 'safe');
}

function insecureAdminAction(actorId) {
  setResult('insecure', `Admin action executed by user ${actorId}. The endpoint skipped role validation.`, 'danger');
  addEntry('Admin bypass', `User ${actorId} triggered admin-only export with no authorization gate.`, 'danger');
}

function secureAdminAction(role, actorId) {
  if (role !== 'admin') {
    setResult('secure', `Admin action denied for user ${actorId}. Role ${role} is insufficient.`, 'safe');
    addEntry('Admin gate enforced', `User ${actorId} was blocked from admin-only action by a role check.`, 'safe');
    return;
  }

  setResult('secure', `Admin action executed for user ${actorId} after server-side role validation.`, 'safe');
  addEntry('Admin action permitted', `Authorized admin action completed for user ${actorId}.`, 'safe');
}

function insecurePromote(actorId) {
  state.insecureRoleMap[actorId] = 'admin';
  setResult('insecure', `User ${actorId} changed role to admin by posting directly to /set-role.`, 'danger');
  addEntry('Privilege escalation', `User ${actorId} self-promoted to admin because the endpoint trusted the request body.`, 'danger');
}

function securePromote(role, actorId) {
  if (role !== 'admin') {
    setResult('secure', `Role change denied. User ${actorId} cannot assign admin privileges.`, 'safe');
    addEntry('Privilege escalation blocked', `User ${actorId} was prevented from modifying role mappings without admin authority.`, 'safe');
    return;
  }

  setResult('secure', 'Admin initiated role management. Change request accepted under policy controls.', 'safe');
  addEntry('Controlled privilege management', 'Role changes are only allowed after explicit admin authorization checks.', 'safe');
}

document.querySelectorAll('.control-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const mode = form.dataset.mode;
    const formData = new FormData(form);
    const role = formData.get('role');
    const actorId = Number(formData.get('actorId'));
    const recordId = Number(formData.get('recordId'));

    if (mode === 'insecure') {
      insecureRunCheck(role, actorId, recordId);
    } else {
      secureRunCheck(role, actorId, recordId);
    }
  });
});

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.closest('.panel');
    const mode = panel.classList.contains('panel-danger') ? 'insecure' : 'secure';
    const form = panel.querySelector('.control-form');
    const roleField = form.querySelector('select[name="role"]');
    const actorField = form.querySelector('input[name="actorId"]');
    const recordField = form.querySelector('input[name="recordId"]');
    const scenario = button.dataset.scenario;
    const role = roleField.value;
    const actorId = Number(actorField.value);

    if (scenario === 'admin-action') {
      if (mode === 'insecure') {
        roleField.value = 'user';
        actorField.value = '2';
        insecureAdminAction(2);
      } else {
        roleField.value = 'user';
        actorField.value = '2';
        secureAdminAction('user', 2);
      }
      return;
    }

    if (scenario === 'idor') {
      if (mode === 'insecure') {
        roleField.value = 'user';
        actorField.value = '2';
        recordField.value = '101';
        insecureRunCheck('user', 2, 101);
      } else {
        roleField.value = 'user';
        actorField.value = '2';
        recordField.value = '101';
        secureRunCheck('user', 2, 101);
      }
      return;
    }

    if (scenario === 'promote') {
      if (mode === 'insecure') {
        roleField.value = 'user';
        actorField.value = '2';
        insecurePromote(2);
      } else {
        securePromote(role, actorId);
      }
    }
  });
});

addEntry('Lab ready', 'Use the forms and scenario buttons to test access control failures and mitigations.', 'safe');
