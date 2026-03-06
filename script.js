let audioContext;
let analyser;
let dataArray;
let pieces = [];
const canvas = document.getElementById("meter");
const ctx = canvas.getContext("2d");

document.getElementById("startBtn").addEventListener("click", async () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  dataArray = new Float32Array(analyser.fftSize);
  detectFrequency();
});

document.getElementById("addPieceBtn").addEventListener("click", () => {
  addPiece("", "");
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const savedPieces = pieces.map(div => {
    return {
      name: div.querySelector("input[type=text]").value,
      freq: div.querySelector("input[type=number]").value
    };
  });
  localStorage.setItem("drumTunerPieces", JSON.stringify(savedPieces));
  alert("Afinações salvas!");
});

document.getElementById("loadBtn").addEventListener("click", () => {
  const savedPieces = JSON.parse(localStorage.getItem("drumTunerPieces") || "[]");
  const container = document.getElementById("pieces");
  container.innerHTML = "";
  pieces = [];
  savedPieces.forEach(p => addPiece(p.name, p.freq));
  alert("Afinações carregadas!");
});

function addPiece(name, freq) {
  const container = document.getElementById("pieces");
  const div = document.createElement("div");
  div.classList.add("piece");

  div.innerHTML = `
    <input type="text" placeholder="Nome da peça" value="${name}">
    <input type="number" placeholder="Frequência alvo (Hz)" value="${freq}">
  `;

  container.appendChild(div);
  pieces.push(div);
}

function detectFrequency() {
  analyser.getFloatTimeDomainData(dataArray);

  const bufferLength = analyser.fftSize;
  let maxVal = 0;
  let dominantFreq = 0;

  for (let i = 0; i < bufferLength; i++) {
    const val = Math.abs(dataArray[i]);
    if (val > maxVal) {
      maxVal = val;
      dominantFreq = i * (audioContext.sampleRate / analyser.fftSize);
    }
  }

  document.getElementById("freq").textContent = dominantFreq.toFixed(2);

  let status = "Sem referência definida";
  let targetFreq = null;

  for (const div of pieces) {
    const name = div.querySelector("input[type=text]").value;
    const freq = parseFloat(div.querySelector("input[type=number]").value);

    if (!isNaN(freq)) {
      targetFreq = freq;
      if (Math.abs(dominantFreq - freq) < 5) {
        status = `Afinado em ${name}`;
      } else if (dominantFreq > freq) {
        status = `${name}: acima da frequência alvo`;
      } else {
        status = `${name}: abaixo da frequência alvo`;
      }
      break;
    }
  }

  document.getElementById("status").textContent = status;
  drawMeter(dominantFreq, targetFreq);

  requestAnimationFrame(detectFrequency);
}

function drawMeter(currentFreq, targetFreq) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Barra de fundo
  ctx.fillStyle = "#444";
  ctx.fillRect(20, 60, 260, 30);

  if (targetFreq) {
    const diff = currentFreq - targetFreq;
    const position = 150 + diff; // deslocamento simples

    // Barra dinâmica
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(position, 60, 10, 30);

    // Linha alvo
    ctx.strokeStyle = "#0f0";
    ctx.beginPath();
    ctx.moveTo(150, 50);
    ctx.lineTo(150, 100);
    ctx.stroke();
  }
}
