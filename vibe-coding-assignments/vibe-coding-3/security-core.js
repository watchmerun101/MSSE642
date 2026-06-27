(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.SecurityCore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SAMPLE_USERS = [
    { id: 1, username: 'admin', role: 'admin' },
    { id: 2, username: 'olivia', role: 'user' },
    { id: 3, username: 'liam', role: 'user' }
  ];

  const PRESET_PAYLOADS = {
    tautology: "' OR '1'='1",
    union: "' UNION SELECT id, username, role FROM users--",
    comment: "olivia'--",
    normal: 'olivia'
  };

  function detectPayloadType(input) {
    const value = String(input || '');
    if (/\bunion\b/i.test(value)) {
      return 'union';
    }
    if (/\bor\b\s*['\"]?1['\"]?\s*=\s*['\"]?1['\"]?/i.test(value)) {
      return 'tautology';
    }
    if (/--|\/\*/.test(value)) {
      return 'comment';
    }
    return 'normal';
  }

  function buildInsecureQuery(payload) {
    return "SELECT id, username, role FROM users WHERE username = '" + payload + "';";
  }

  function buildSecureQuery() {
    return {
      statement: 'SELECT id, username, role FROM users WHERE username = ?',
      binding: '[payload]'
    };
  }

  function findByUsername(username) {
    return SAMPLE_USERS.filter(function (user) {
      return user.username === username;
    });
  }

  function runInsecureFlow(payload) {
    const payloadType = detectPayloadType(payload);
    const query = buildInsecureQuery(payload);

    if (payloadType === 'tautology') {
      return {
        payload: payload,
        payloadType: payloadType,
        queryPreview: query,
        injectionSucceeded: true,
        statusLabel: 'Injection Succeeded',
        impact: 'Authentication and row filtering were bypassed by tautology logic.',
        returnedRows: SAMPLE_USERS.slice()
      };
    }

    if (payloadType === 'union') {
      const mergedRows = SAMPLE_USERS.concat([
        { id: 99, username: 'exposed_admin_hash', role: 'leaked' }
      ]);
      return {
        payload: payload,
        payloadType: payloadType,
        queryPreview: query,
        injectionSucceeded: true,
        statusLabel: 'Injection Succeeded',
        impact: 'UNION payload expanded results beyond intended query scope.',
        returnedRows: mergedRows
      };
    }

    if (payloadType === 'comment') {
      const results = findByUsername('olivia');
      return {
        payload: payload,
        payloadType: payloadType,
        queryPreview: query,
        injectionSucceeded: true,
        statusLabel: 'Injection Succeeded',
        impact: 'Comment termination altered query parsing and bypassed trailing logic.',
        returnedRows: results
      };
    }

    return {
      payload: payload,
      payloadType: payloadType,
      queryPreview: query,
      injectionSucceeded: false,
      statusLabel: 'No Injection Detected',
      impact: 'Input behaved like normal data.',
      returnedRows: findByUsername(String(payload || ''))
    };
  }

  function runSecureFlow(payload) {
    const payloadType = detectPayloadType(payload);
    const secureQuery = buildSecureQuery();

    if (payloadType !== 'normal') {
      return {
        payload: payload,
        payloadType: payloadType,
        queryPreview: secureQuery.statement + ' | binding=' + secureQuery.binding,
        blocked: true,
        statusLabel: 'Injection Blocked',
        impact: 'Payload was rejected by input validation before query execution.',
        returnedRows: []
      };
    }

    return {
      payload: payload,
      payloadType: payloadType,
      queryPreview: secureQuery.statement + ' | binding=' + secureQuery.binding,
      blocked: false,
      statusLabel: 'Safe Query Executed',
      impact: 'Input accepted as data and executed with parameterized query handling.',
      returnedRows: findByUsername(String(payload || ''))
    };
  }

  return {
    SAMPLE_USERS: SAMPLE_USERS,
    PRESET_PAYLOADS: PRESET_PAYLOADS,
    detectPayloadType: detectPayloadType,
    runInsecureFlow: runInsecureFlow,
    runSecureFlow: runSecureFlow
  };
});
