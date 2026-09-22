// Dashboard logic: SOS trigger, AI safety assistant, voice recognition

let currentUser = null;
let pendingCoords = null;
let currentActiveEmergency = null;

document.addEventListener("DOMContentLoaded", async () => {
  Auth.requireAuth();
  currentUser = Auth.getUser();

  if (currentUser) {
    document.getElementById("user-display-name").innerText = currentUser.name;
  }

  // Check active emergency status
  await checkActiveEmergency();

  // Load Contacts
  await loadContactsPreview();

  // Setup Voice
  setupVoice();

  // Event Listeners
  setupEventListeners();
});

async function checkActiveEmergency() {
  try {
    const res = await API.getActiveEmergency();
    if (res.active && res.emergency) {
      currentActiveEmergency = res.emergency;
      const banner = document.getElementById("active-emergency-banner");
      banner.style.display = "flex";
      document.getElementById("active-sos-title").innerText = `${res.emergency.severity} - ${res.emergency.emergency_type}`;
      document.getElementById("active-sos-desc").innerText = res.emergency.description || "Active SOS initiated.";
      document.getElementById("active-sos-link").href = `/emergency.html?id=${res.emergency.id}`;
    } else {
      document.getElementById("active-emergency-banner").style.display = "none";
    }
  } catch (err) {
    console.warn("Could not fetch active emergency:", err);
  }
}

async function loadContactsPreview() {
  const container = document.getElementById("dashboard-contacts-list");
  const countBadge = document.getElementById("contact-count");

  try {
    const contacts = await API.getContacts();
    countBadge.innerText = contacts.length;

    if (contacts.length === 0) {
      container.innerHTML = `
        <div style="padding: 1rem; background: #0f172a; border-radius: 8px; text-align: center;">
          <p style="color: #f59e0b; font-size: 0.9rem; margin-bottom: 0.5rem;">⚠️ No emergency contacts registered!</p>
          <a href="/contacts.html" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">+ Add Contact Now</a>
        </div>
      `;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;
    contacts.slice(0, 3).forEach(c => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: #0f172a; border-radius: 6px;">
          <div>
            <strong>${c.name}</strong> <span style="font-size: 0.8rem; color: #94a3b8;">(${c.relationship})</span>
            <div style="font-size: 0.85rem; color: #cbd5e1;">${c.phone}</div>
          </div>
          <a href="tel:${c.phone}" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Call</a>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; font-size: 0.85rem;">Could not load contacts.</p>`;
  }
}

function setupVoice() {
  const micBtn = document.getElementById("voice-mic-btn");
  const statusMsg = document.getElementById("voice-status-msg");
  const langSelect = document.getElementById("voice-lang-select");
  const inputDesc = document.getElementById("ai-input-desc");

  VoiceHandler.init(
    (text) => {
      inputDesc.value = text;
      statusMsg.style.display = "block";
      statusMsg.innerText = `Recognized: "${text}"`;
      // Trigger instant AI analysis
      runAIAnalysis(text);
    },
    (status) => {
      statusMsg.style.display = "block";
      statusMsg.innerText = status;
    }
  );

  langSelect.addEventListener("change", (e) => {
    VoiceHandler.setLanguage(e.target.value);
  });

  micBtn.addEventListener("click", () => {
    if (VoiceHandler.isListening) {
      VoiceHandler.stopListening();
      micBtn.innerText = "🎤 Speak";
    } else {
      VoiceHandler.startListening();
      micBtn.innerText = "⏹️ Stop";
    }
  });
}

function setupEventListeners() {
  const sosTriggerBtn = document.getElementById("sos-trigger-btn");
  const sosModal = document.getElementById("sos-modal");
  const cancelSosBtn = document.getElementById("cancel-sos-btn");
  const confirmSosBtn = document.getElementById("confirm-sos-btn");
  const modalLocStatus = document.getElementById("modal-location-status");

  // Open SOS Confirmation Modal & Acquire GPS coordinates
  sosTriggerBtn.addEventListener("click", async () => {
    sosModal.style.display = "flex";
    modalLocStatus.innerText = "📍 Acquiring GPS coordinates...";
    modalLocStatus.style.color = "#60a5fa";

    try {
      pendingCoords = await LocationHandler.getCurrentLocation();
      modalLocStatus.innerText = `📍 Location locked: ${pendingCoords.latitude.toFixed(5)}, ${pendingCoords.longitude.toFixed(5)}`;
      modalLocStatus.style.color = "#34d399";
    } catch (e) {
      modalLocStatus.innerText = `⚠️ Location warning: ${e.message}`;
      modalLocStatus.style.color = "#f59e0b";
      pendingCoords = null;
    }
  });

  cancelSosBtn.addEventListener("click", () => {
    sosModal.style.display = "none";
  });

  confirmSosBtn.addEventListener("click", async () => {
    confirmSosBtn.disabled = true;
    confirmSosBtn.innerText = "Broadcasting SOS...";
    const desc = document.getElementById("modal-emergency-desc").value.trim();

    try {
      const payload = {
        description: desc || "Urgent SOS Alert triggered by user",
        latitude: pendingCoords ? pendingCoords.latitude : null,
        longitude: pendingCoords ? pendingCoords.longitude : null
      };

      const res = await API.createEmergency(payload);
      sosModal.style.display = "none";
      window.location.href = `/emergency.html?id=${res.emergency_id}`;
    } catch (err) {
      alert("Failed to trigger emergency: " + err.message);
      confirmSosBtn.disabled = false;
      confirmSosBtn.innerText = "🚨 Activate SOS Now";
    }
  });

  // AI Assistant Analyze button
  const aiAnalyzeBtn = document.getElementById("ai-analyze-btn");
  const clearAiBtn = document.getElementById("clear-ai-btn");
  const inputDesc = document.getElementById("ai-input-desc");

  aiAnalyzeBtn.addEventListener("click", () => {
    const text = inputDesc.value.trim();
    if (text) {
      runAIAnalysis(text);
    }
  });

  clearAiBtn.addEventListener("click", () => {
    inputDesc.value = "";
    document.getElementById("ai-result-box").style.display = "none";
    document.getElementById("voice-status-msg").style.display = "none";
  });

  // AI Trigger SOS button
  const aiTriggerSosBtn = document.getElementById("ai-trigger-sos-btn");
  aiTriggerSosBtn.addEventListener("click", () => {
    document.getElementById("modal-emergency-desc").value = inputDesc.value.trim();
    sosTriggerBtn.click();
  });

  // Quick Resolve active emergency
  const quickResolveBtn = document.getElementById("quick-resolve-btn");
  quickResolveBtn.addEventListener("click", async () => {
    if (!currentActiveEmergency) return;
    if (confirm("Are you sure you want to mark this emergency as RESOLVED?")) {
      try {
        await API.resolveEmergency(currentActiveEmergency.id, "User marked safe from dashboard");
        await checkActiveEmergency();
      } catch (e) {
        alert("Error resolving emergency: " + e.message);
      }
    }
  });

  // Automatic Safety Monitoring Controls
  setupSafetyMonitoring();
}

let isSafetyMonitoringActive = false;
let dangerCountdownTimer = null;
let dangerCountdownSeconds = 10;
let lastAccelerationMagnitude = 0;

function setupSafetyMonitoring() {
  const startBtn = document.getElementById("start-safety-monitor-btn");
  const simBtn = document.getElementById("simulate-danger-btn");
  const badge = document.getElementById("safety-monitor-badge");
  const statusDiv = document.getElementById("safety-monitor-status");

  const dangerModal = document.getElementById("danger-detection-modal");
  const safeBtn = document.getElementById("danger-safe-btn");
  const sosDangerBtn = document.getElementById("danger-sos-btn");
  const countdownEl = document.getElementById("danger-countdown");

  startBtn.addEventListener("click", () => {
    if (!isSafetyMonitoringActive) {
      // Turn ON
      isSafetyMonitoringActive = true;
      startBtn.innerText = "⏹ Stop Safety Monitoring";
      startBtn.className = "btn btn-secondary";
      badge.innerText = "ACTIVE";
      badge.className = "badge badge-active";
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "#34d399";
      badge.style.border = "1px solid #10b981";
      statusDiv.style.color = "#34d399";
      statusDiv.innerHTML = "🟢 <strong>Safety Monitoring Active:</strong> Watching for sudden impact, motion spikes, or emergency triggers.";
      simBtn.style.display = "block";

      // Register DeviceMotion if supported
      if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", handleDeviceMotion);
      }
    } else {
      // Turn OFF
      isSafetyMonitoringActive = false;
      startBtn.innerText = "▶ Start Safety Monitoring";
      startBtn.className = "btn btn-primary";
      badge.innerText = "OFF";
      badge.className = "badge";
      badge.style.background = "#334155";
      badge.style.color = "#cbd5e1";
      badge.style.border = "none";
      statusDiv.style.color = "#94a3b8";
      statusDiv.innerHTML = "🛡️ Safety monitoring is currently turned off.";
      simBtn.style.display = "none";

      if (window.DeviceMotionEvent) {
        window.removeEventListener("devicemotion", handleDeviceMotion);
      }
    }
  });

  // Simulate Danger Button (Safe Demo Mode for presentations)
  simBtn.addEventListener("click", () => {
    triggerPossibleDanger("Unusual movement or sudden impact simulated in Safe Demo Mode.");
  });

  // Modal response: User is Safe
  safeBtn.addEventListener("click", () => {
    clearInterval(dangerCountdownTimer);
    dangerModal.style.display = "none";
    VoiceHandler.speak("Glad you are safe. Alert cancelled.", "en-IN");
  });

  // Modal response: User requests SOS immediately
  sosDangerBtn.addEventListener("click", async () => {
    clearInterval(dangerCountdownTimer);
    dangerModal.style.display = "none";
    await executeAutomaticSOS("User confirmed danger after possible impact detection");
  });
}

function handleDeviceMotion(event) {
  if (!isSafetyMonitoringActive) return;

  const acc = event.accelerationIncludingGravity || event.acceleration;
  if (!acc) return;

  const x = acc.x || 0;
  const y = acc.y || 0;
  const z = acc.z || 0;
  const currentMagnitude = Math.sqrt(x * x + y * y + z * z);

  // Detect high impact spike (e.g., fall or collision)
  // Normal gravity is ~9.8m/s². Spike > 25 indicates sudden drop or impact.
  if (currentMagnitude > 26 && Math.abs(currentMagnitude - lastAccelerationMagnitude) > 15) {
    triggerPossibleDanger("High acceleration spike and sudden motion change detected.");
  }
  lastAccelerationMagnitude = currentMagnitude;
}

function triggerPossibleDanger(reason) {
  const dangerModal = document.getElementById("danger-detection-modal");
  const countdownEl = document.getElementById("danger-countdown");
  const reasonText = document.getElementById("danger-reason-text");

  if (dangerModal.style.display === "flex") return; // Already active

  reasonText.innerText = reason || "We detected unusual device movement.";
  dangerCountdownSeconds = 10;
  countdownEl.innerText = dangerCountdownSeconds;
  dangerModal.style.display = "flex";

  // Audio prompt
  VoiceHandler.speak("Possible danger detected. Are you safe?", "en-IN");

  clearInterval(dangerCountdownTimer);
  dangerCountdownTimer = setInterval(async () => {
    dangerCountdownSeconds--;
    countdownEl.innerText = dangerCountdownSeconds;

    if (dangerCountdownSeconds <= 0) {
      clearInterval(dangerCountdownTimer);
      dangerModal.style.display = "none";
      // Auto trigger SOS on no response
      await executeAutomaticSOS("Automatic SOS triggered: No user response after possible danger detection.");
    }
  }, 1000);
}

async function executeAutomaticSOS(reason) {
  try {
    let coords = null;
    try {
      coords = await LocationHandler.getCurrentLocation();
    } catch (e) {
      console.warn("Could not obtain GPS during auto-SOS:", e);
    }

    const payload = {
      emergency_type: "Possible Fall / Accident",
      severity: "CRITICAL",
      description: reason,
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    };

    const res = await API.createEmergency(payload);
    window.location.href = `/emergency.html?id=${res.emergency_id}`;
  } catch (err) {
    alert("Automatic SOS error: " + err.message);
  }
}

async function runAIAnalysis(text) {
  const resultBox = document.getElementById("ai-result-box");
  const aiAnalyzeBtn = document.getElementById("ai-analyze-btn");
  const lang = document.getElementById("voice-lang-select").value.startsWith("te") ? "te" : "en";

  aiAnalyzeBtn.disabled = true;
  aiAnalyzeBtn.innerText = "Analyzing...";

  try {
    const res = await API.analyzeEmergency(text, lang);

    resultBox.style.display = "block";
    document.getElementById("ai-res-type").innerText = res.emergency_type;

    const sevBadge = document.getElementById("ai-res-severity");
    sevBadge.innerText = res.severity;
    sevBadge.className = "badge " + (res.severity === "CRITICAL" ? "badge-critical" : res.severity === "HIGH" ? "badge-high" : "badge-medium");

    document.getElementById("ai-res-explanation").innerText = res.explanation;

    // Guidance list
    const guidanceList = document.getElementById("ai-res-guidance");
    guidanceList.innerHTML = res.immediate_guidance.map(g => `<li>${g}</li>`).join("");

    // Details needed list
    const infoList = document.getElementById("ai-res-info-needed");
    infoList.innerHTML = res.information_needed.map(i => `<li>${i}</li>`).join("");

    // Audio guidance playback if available
    const spokenGuidance = res.immediate_guidance[0] || "";
    if (spokenGuidance) {
      VoiceHandler.speak(spokenGuidance, lang === "te" ? "te-IN" : "en-IN");
    }
  } catch (err) {
    alert("AI Analysis error: " + err.message);
  } finally {
    aiAnalyzeBtn.disabled = false;
    aiAnalyzeBtn.innerText = "Analyze Situation with AI";
  }
}
