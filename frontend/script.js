/**
 * script.js
 * Frontend controller for Industrial Machine Log Integrity Checker
 */

const API_BASE_URL = (window.location.protocol === 'file:' || !window.location.port || window.location.port !== '5000')
  ? 'http://127.0.0.1:5000/api'
  : '/api';

// ==========================================
// 1. Theme Management (Plain SVG Icon)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

function updateThemeIcons(theme) {
  if (theme === 'dark') {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcons(newTheme);
}

themeToggleBtn.addEventListener('click', toggleTheme);

// ==========================================
// 2. Session Divisor Loader
// ==========================================
const step4OriginalDivisor = document.getElementById('step4OriginalDivisor');
const step4ReceivedDivisor = document.getElementById('step4ReceivedDivisor');

async function loadSessionDivisor() {
  try {
    const res = await fetch(`${API_BASE_URL}/divisor`);
    if (res.ok) {
      const data = await res.json();
      const div = data.divisor;
      step4OriginalDivisor.textContent = div;
      step4ReceivedDivisor.textContent = div;
    }
  } catch (err) {
    console.error('Error fetching session divisor:', err);
    step4OriginalDivisor.textContent = 'Server Offline';
    step4ReceivedDivisor.textContent = 'Server Offline';
  }
}

// ==========================================
// 3. Helper Functions
// ==========================================
function generateRandomLog() {
  const machines = ['TURBINE_01', 'CNC_MILL_Z', 'CHEM_REACTOR_4', 'BOILER_UNIT_2', 'INVERTER_B'];
  const statuses = ['OK', 'NORMAL', 'OPTIMAL', 'RUNNING'];
  const machine = machines[Math.floor(Math.random() * machines.length)];
  const rpm = Math.floor(1000 + Math.random() * 4000);
  const temp = (40 + Math.random() * 50).toFixed(1);
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  
  return `[${timestamp}] ${machine} RPM:${rpm} TEMP:${temp}C STATUS:${status}`;
}

function handleFileUpload(fileInput, targetTextarea, onLoaded) {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    targetTextarea.value = e.target.result;
    if (onLoaded) onLoaded(e.target.result);
  };
  reader.readAsText(file);
}

// ==========================================
// 4. Row 1 Left: Original Machine Log
// ==========================================
const originalLogInput = document.getElementById('originalLogInput');
const originalFileInput = document.getElementById('originalFileInput');
const originalRandomBtn = document.getElementById('originalRandomBtn');
const computeCrcBtn = document.getElementById('computeCrcBtn');

const step1OriginalText = document.getElementById('step1OriginalText');
const step2OriginalBinary = document.getElementById('step2OriginalBinary');
const step3OriginalPadded = document.getElementById('step3OriginalPadded');
const step5OriginalCrc = document.getElementById('step5OriginalCrc');
const step5OriginalHex = document.getElementById('step5OriginalHex');

originalLogInput.addEventListener('input', () => {
  step1OriginalText.textContent = originalLogInput.value || '[waiting for input...]';
});

originalFileInput.addEventListener('change', () => {
  handleFileUpload(originalFileInput, originalLogInput, (content) => {
    step1OriginalText.textContent = content || '[waiting for input...]';
  });
});

originalRandomBtn.addEventListener('click', () => {
  const log = generateRandomLog();
  originalLogInput.value = log;
  step1OriginalText.textContent = log;
});

computeCrcBtn.addEventListener('click', async () => {
  const logText = originalLogInput.value.trim();
  if (!logText) {
    alert('Please enter or generate an original log first.');
    return;
  }

  computeCrcBtn.disabled = true;
  computeCrcBtn.textContent = 'Computing...';

  try {
    const res = await fetch(`${API_BASE_URL}/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: logText })
    });

    if (!res.ok) throw new Error('Failed to compute CRC from backend');

    const data = await res.json();
    const steps = data.steps;

    // Render Steps
    step1OriginalText.textContent = `"${steps.original_text}"`;
    step2OriginalBinary.textContent = steps.binary;
    step3OriginalPadded.textContent = steps.padded;
    step4OriginalDivisor.textContent = steps.divisor;
    step5OriginalCrc.textContent = steps.remainder;
    step5OriginalHex.textContent = `Hex: 0x${steps.hex}`;

    // Update Session Divisor across page
    step4OriginalDivisor.textContent = steps.divisor;
    step4ReceivedDivisor.textContent = steps.divisor;

    // Auto-fill CRC in Received Log input
    document.getElementById('receivedCrcInput').value = data.crc;

  } catch (err) {
    console.error(err);
    alert('Error connecting to backend server. Make sure backend/app.py is running.');
  } finally {
    computeCrcBtn.disabled = false;
    computeCrcBtn.textContent = 'Compute CRC';
  }
});

// ==========================================
// 5. Row 1 Right: Received Log & Verification
// ==========================================
const receivedLogInput = document.getElementById('receivedLogInput');
const receivedFileInput = document.getElementById('receivedFileInput');
const receivedRandomBtn = document.getElementById('receivedRandomBtn');
const receivedCrcInput = document.getElementById('receivedCrcInput');
const verifyIntegrityBtn = document.getElementById('verifyIntegrityBtn');

const step1ReceivedText = document.getElementById('step1ReceivedText');
const step2ReceivedBinary = document.getElementById('step2ReceivedBinary');
const step3ReceivedCodeword = document.getElementById('step3ReceivedCodeword');
const step5ReceivedRemainder = document.getElementById('step5ReceivedRemainder');
const step6ReceivedResult = document.getElementById('step6ReceivedResult');
const resultChip = document.getElementById('resultChip');

receivedLogInput.addEventListener('input', () => {
  step1ReceivedText.textContent = receivedLogInput.value || '[waiting for input...]';
});

receivedFileInput.addEventListener('change', () => {
  handleFileUpload(receivedFileInput, receivedLogInput, (content) => {
    step1ReceivedText.textContent = content || '[waiting for input...]';
  });
});

receivedRandomBtn.addEventListener('click', () => {
  const log = generateRandomLog();
  receivedLogInput.value = log;
  step1ReceivedText.textContent = log;
});

verifyIntegrityBtn.addEventListener('click', async () => {
  const logText = receivedLogInput.value.trim();
  const crcText = receivedCrcInput.value.trim();

  if (!logText) {
    alert('Please enter or upload a received log message.');
    return;
  }

  if (!crcText) {
    alert('Please enter or compute the 32-bit CRC from sender.');
    return;
  }

  verifyIntegrityBtn.disabled = true;
  verifyIntegrityBtn.textContent = 'Verifying...';

  try {
    const res = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log: logText, crc: crcText })
    });

    if (!res.ok) throw new Error('Failed to verify from backend');

    const data = await res.json();
    const steps = data.steps;
    const isAccepted = data.accepted;

    step1ReceivedText.textContent = `"${steps.received_text}"`;
    step2ReceivedBinary.textContent = steps.binary;
    step3ReceivedCodeword.textContent = steps.codeword;
    step4ReceivedDivisor.textContent = steps.divisor;
    step5ReceivedRemainder.textContent = steps.remainder;

    resultChip.classList.remove('hidden', 'accept', 'reject');

    if (isAccepted) {
      step6ReceivedResult.textContent = 'ACCEPT (Remainder is 32 zeros)';
      step6ReceivedResult.className = 'step-data font-mono';
      
      resultChip.classList.add('accept');
      resultChip.textContent = '✓ ACCEPT — Message integrity verified';
    } else {
      step6ReceivedResult.textContent = 'REJECT (Non-zero remainder / Corruption detected)';
      step6ReceivedResult.className = 'step-data font-mono';
      
      resultChip.classList.add('reject');
      resultChip.textContent = '✗ REJECT — Corruption detected';
    }

  } catch (err) {
    console.error(err);
    alert('Error verifying integrity. Make sure backend/app.py is running.');
  } finally {
    verifyIntegrityBtn.disabled = false;
    verifyIntegrityBtn.textContent = 'Verify Integrity';
  }
});

// ==========================================
// 6. Page Initialization
// ==========================================
initTheme();
loadSessionDivisor();
