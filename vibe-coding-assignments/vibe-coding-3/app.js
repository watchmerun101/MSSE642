const payloadInput = document.querySelector('#payload');
const runDemoButton = document.querySelector('#run-demo');
const logNode = document.querySelector('#log');

const insecureQueryNode = document.querySelector('#insecure-query');
const secureQueryNode = document.querySelector('#secure-query');
const insecureResultNode = document.querySelector('#insecure-result');
const secureResultNode = document.querySelector('#secure-result');

function addLogEntry(title, detail, tone) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${tone === 'danger' ? 'log-danger' : tone === 'safe' ? 'log-safe' : ''}`;
  entry.innerHTML = `<strong>${title}</strong><br>${detail}`;
  logNode.prepend(entry);
}

function setResult(node, message, tone) {
  node.className = tone === 'danger' ? 'result-danger' : 'result-safe';
  node.textContent = message;
}

function summarizeRows(rows) {
  if (!rows.length) {
    return 'No rows returned.';
  }

  const preview = rows.slice(0, 3).map((row) => `${row.id}:${row.username}/${row.role}`).join(', ');
  return `${rows.length} row(s) returned. Preview: ${preview}`;
}

function runComparison(payload) {
  const insecure = SecurityCore.runInsecureFlow(payload);
  const secure = SecurityCore.runSecureFlow(payload);

  insecureQueryNode.textContent = insecure.queryPreview;
  secureQueryNode.textContent = secure.queryPreview;

  setResult(
    insecureResultNode,
    `${insecure.statusLabel} | ${insecure.impact} ${summarizeRows(insecure.returnedRows)}`,
    insecure.injectionSucceeded ? 'danger' : 'safe'
  );

  setResult(
    secureResultNode,
    `${secure.statusLabel} | ${secure.impact} ${summarizeRows(secure.returnedRows)}`,
    secure.blocked ? 'safe' : 'safe'
  );

  addLogEntry(
    `Payload tested: ${payload}`,
    `Insecure outcome: ${insecure.statusLabel}. Secure outcome: ${secure.statusLabel}.`,
    insecure.injectionSucceeded ? 'danger' : 'safe'
  );
}

runDemoButton.addEventListener('click', () => {
  runComparison(payloadInput.value);
});

document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const presetKey = button.dataset.preset;
    payloadInput.value = SecurityCore.PRESET_PAYLOADS[presetKey];
    runComparison(payloadInput.value);
  });
});

runComparison(payloadInput.value);
