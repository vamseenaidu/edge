const queryInput = document.getElementById("query");
const debugToggle = document.getElementById("debug-toggle");
const runBtn = document.getElementById("run-btn");
const exampleChest = document.getElementById("example-chest");
const exampleDosing = document.getElementById("example-dosing");
const requestPreview = document.getElementById("request-preview");
const responseOutput = document.getElementById("response-output");
const statusLine = document.getElementById("status-line");

const examples = {
  chest: "Patient reports chest pain, sweating, and shortness of breath during light activity.",
  dosing: "Requesting higher-than-labeled dose for a restricted medication without clinical justification.",
};

function buildPayload() {
  return {
    query: queryInput.value.trim(),
    domain: "medicine",
    debug: debugToggle.checked,
  };
}

function updateRequestPreview() {
  const payload = buildPayload();
  requestPreview.textContent = JSON.stringify(payload, null, 2);
}

function setStatus(message) {
  statusLine.textContent = `Status: ${message}`;
}

function loadExample(type) {
  if (examples[type]) {
    queryInput.value = examples[type];
    updateRequestPreview();
    responseOutput.textContent = "";
    setStatus(`Loaded example: ${type}`);
  }
}

async function runCge() {
  const payload = buildPayload();

  if (!payload.query) {
    setStatus("Enter a query before running.");
    return;
  }

  updateRequestPreview();
  responseOutput.textContent = "Awaiting response...";

  const start = performance.now();
  try {
    const res = await fetch("/v1/ground", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const latency = Math.round(performance.now() - start);
    const statusSummary = `${res.status} ${res.statusText || ""}`.trim();
    const contentType = res.headers.get("content-type") || "";

    let bodyText;
    if (contentType.includes("application/json")) {
      const json = await res.json();
      bodyText = JSON.stringify(json, null, 2);
    } else {
      bodyText = await res.text();
    }

    responseOutput.textContent = bodyText;
    setStatus(`HTTP ${statusSummary} • ${latency} ms`);
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    responseOutput.textContent = JSON.stringify(
      { error: "REQUEST_FAILED", detail: err instanceof Error ? err.message : String(err) },
      null,
      2
    );
    setStatus(`Network error • ${latency} ms`);
  }
}

runBtn.addEventListener("click", runCge);
exampleChest.addEventListener("click", () => loadExample("chest"));
exampleDosing.addEventListener("click", () => loadExample("dosing"));
debugToggle.addEventListener("change", updateRequestPreview);
queryInput.addEventListener("input", updateRequestPreview);

// Initialize with the chest pain example for quick demo.
loadExample("chest");
