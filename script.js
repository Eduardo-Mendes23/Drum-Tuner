let audioContext;
let analyser;
let dataArray;
let pieces = [];
let freqHistory = [];

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

  // Adiciona ao histórico
  freqHistory.push(dominantFreq);
  if (freqHistory.length > 10) freqHistory.shift(); // mantém últimas 10 leituras

  // Calcula média móvel
  const avgFreq = freqHistory.reduce((a, b) => a + b, 0) / freqHistory.length;

  document.getElementById("freq").textContent = avgFreq.toFixed(2);

  // Comparação com peças
  let status = "Sem referência definida";
  for (const div of pieces) {
    const name = div.querySelector("input[type=text]").value;
    const targetFreq = parseFloat(div.querySelector("input[type=number]").value);

    if (!isNaN(targetFreq)) {
      if (Math.abs(avgFreq - targetFreq) < 5) {
        status = `Afinado em ${name}`;
        break;
      } else if (avgFreq > targetFreq) {
        status = `${name}: acima da frequência alvo`;
      } else {
        status = `${name}: abaixo da frequência alvo`;
      }
    }
  }

  document.getElementById("status").textContent = status;

  // Atualiza a cada 200ms em vez de cada frame
  setTimeout(detectFrequency, 200);
}
