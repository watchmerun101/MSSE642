const log = document.querySelector('#log');
const resultNodes = {
  insecure: document.querySelector('[data-result="insecure"]'),
  secure: document.querySelector('[data-result="secure"]')
};

const state = {
  insecureAttempts: 0,
  secureAttempts: 0,
  secureLocked: false
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

function predictableTokenMessage(tokenNumber) {
  const issuedToken = `session-${tokenNumber}`;
  const nextLikelyToken = `session-${tokenNumber + 1}`;
  return `Predictable session pattern detected:<br><code>session-1, session-2, session-3, ...</code><br>Issued now: <code>${issuedToken}</code><br>Next likely token: <code>${nextLikelyToken}</code>`;
}

function insecureLogin(username, password) {
  state.insecureAttempts += 1;
  const weakPasswords = ['123456', 'password', 'admin'];

  if (username === 'admin' && weakPasswords.includes(password)) {
    const sessionId = `session-${state.insecureAttempts}`;
    setResult('insecure', `Weak password "${password}" accepted.<br>${predictableTokenMessage(state.insecureAttempts)}`, 'danger');
    addEntry('Weak password accepted', `The insecure flow accepted weak password "${password}" and exposed a predictable session sequence (${sessionId}, session-${state.insecureAttempts + 1}, ...).`, 'danger');
    return true;
  }

  setResult('insecure', 'Invalid credentials, but no lockout or rate limit is triggered.', 'danger');
  addEntry('Insecure login failed open', 'The flow still allows unlimited retries and keeps the account exposed to brute-force attempts.', 'danger');
  return false;
}

function secureLogin(username, password) {
  state.secureAttempts += 1;

  if (state.secureLocked) {
    setResult('secure', 'Account locked after repeated failures. Further attempts are blocked until reset.', 'safe');
    addEntry('Secure flow locked account', 'Rate limiting and lockout prevented additional authentication abuse.', 'safe');
    return 'blocked';
  }

  const strongEnough = password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

  if (username === 'admin' && strongEnough) {
    const sessionId = `sess_${crypto.randomUUID()}`;
    setResult('secure', `Authentication succeeded with a random session token: ${sessionId}.`, 'safe');
    addEntry('Secure login succeeded', `Strong credentials were accepted and a non-predictable token was issued (${sessionId.slice(0, 18)}...).`, 'safe');
    return 'success';
  }

  if (!strongEnough) {
    setResult('secure', `Weak password "${password}" rejected by policy before authentication completed.`, 'safe');
    addEntry('Secure policy rejected weak password', `The application blocked weak password "${password}" because it did not meet the minimum strength policy.`, 'safe');
  } else {
    setResult('secure', 'Invalid credentials. Remaining attempts will be rate limited.', 'safe');
    addEntry('Secure login failed closed', 'The application rejected the attempt and retained defensive controls.', 'safe');
  }

  if (state.secureAttempts >= 3) {
    state.secureLocked = true;
    setResult('secure', 'Account locked after repeated failures. Further attempts are blocked until reset.', 'safe');
    addEntry('Secure lockout activated', 'Three consecutive attempts triggered account protection.', 'safe');
  }

  return 'failed';
}

function runBruteForceSimulation(mode) {
  const guesses = ['letmein', 'welcome1', 'qwerty123', '123456'];

  if (mode === 'insecure') {
    addEntry('Brute-force simulation started', `Trying ${guesses.length} common passwords against account admin with no lockout.`, 'danger');

    let compromiseAttempt = null;
    guesses.forEach((guess, index) => {
      const success = insecureLogin('admin', guess);
      addEntry(`Attempt ${index + 1}`, `Tried password "${guess}"`, success ? 'danger' : 'neutral');
      if (success && compromiseAttempt === null) {
        compromiseAttempt = index + 1;
      }
    });

    if (compromiseAttempt !== null) {
      setResult('insecure', `Brute-force simulation: account compromised on attempt ${compromiseAttempt} with no rate limit or lockout.`, 'danger');
      addEntry('Brute-force compromise confirmed', `Attacker gained access in ${compromiseAttempt} attempts because controls did not throttle or lock the account.`, 'danger');
    } else {
      setResult('insecure', `Brute-force simulation: ${guesses.length} attempts were allowed and more guessing is still possible.`, 'danger');
      addEntry('Brute-force exposure', 'Even without a successful guess yet, the application still allows unlimited attempts.', 'danger');
    }

    return;
  }

  state.secureAttempts = 0;
  state.secureLocked = false;
  addEntry('Brute-force simulation started', `Trying ${guesses.length} common passwords against account admin with lockout enabled.`, 'safe');

  let blockedAt = null;
  guesses.forEach((guess, index) => {
    const outcome = secureLogin('admin', guess);
    addEntry(`Attempt ${index + 1}`, `Tried password "${guess}"`, outcome === 'blocked' ? 'safe' : 'neutral');
    if (outcome === 'blocked' && blockedAt === null) {
      blockedAt = index + 1;
    }
  });

  if (blockedAt !== null || state.secureLocked) {
    setResult('secure', `Brute-force simulation: lockout engaged by attempt ${blockedAt ?? 3}; further guesses were blocked.`, 'safe');
    addEntry('Brute-force mitigated', 'The secure flow interrupted credential guessing with account lockout.', 'safe');
  }
}

document.querySelectorAll('.auth-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const mode = form.dataset.mode;
    const formData = new FormData(form);
    const username = formData.get('username').trim();
    const password = formData.get('password');

    if (mode === 'insecure') {
      insecureLogin(username, password);
    } else {
      secureLogin(username, password);
    }
  });
});

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.dataset.scenario;
    const panel = button.closest('.panel');
    const mode = panel.classList.contains('panel-danger') ? 'insecure' : 'secure';
    const form = panel.querySelector('.auth-form');
    const passwordInput = form.querySelector('input[name="password"]');

    if (scenario === 'bruteforce') {
      runBruteForceSimulation(mode);
      return;
    }

    if (scenario === 'weak-password') {
      passwordInput.value = mode === 'insecure' ? '123456' : 'password';
      form.requestSubmit();
      return;
    }

    if (scenario === 'session') {
      if (mode === 'insecure') {
        const tokenNumber = Math.max(1, state.insecureAttempts + 1);
        setResult('insecure', predictableTokenMessage(tokenNumber), 'danger');
        addEntry('Predictable session token', `The insecure flow uses an incrementing token sequence. If current token is session-${tokenNumber}, the next is likely session-${tokenNumber + 1}.`, 'danger');
      } else {
        const token = `sess_${crypto.randomUUID()}`;
        setResult('secure', `Random token issued: ${token.slice(0, 18)}... The identifier is not guessable.`, 'safe');
        addEntry('Random session token', 'The secure flow issued a high-entropy token that resists prediction.', 'safe');
      }
    }
  });
});

addEntry('Lab ready', 'Use the forms and scenario buttons to demonstrate authentication failures and mitigations.', 'safe');