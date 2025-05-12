		const AudioContext = window.AudioContext || window.webkitAudioContext;
		let audioCtx;
		let oscillator;
		let gainNode;
		let convolver;
		let isPlaying = false;
		let stepInterval;
		let currentStep = 0;
		const steps = Array(8).fill(false);

		const freqSlider = document.getElementById('frequency');
		const volSlider = document.getElementById('volume');
		const detuneSlider = document.getElementById('detune');
		const freqValue = document.getElementById('freqValue');
		const volValue = document.getElementById('volValue');
		const detuneValue = document.getElementById('detuneValue');
		const waveformSelect = document.getElementById('waveform');
		const reverbToggle = document.getElementById('reverb');
		const sequencerEl = document.getElementById('sequencer');

		function createReverb(audioCtx) {
			const convolver = audioCtx.createConvolver();
			const length = audioCtx.sampleRate * 3;
			const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
			for (let i = 0; i < 2; i++) {
				const channel = impulse.getChannelData(i);
				for (let j = 0; j < length; j++) {
					channel[j] = (Math.random() * 2 - 1) * (1 - j / length);
				}
			}
			convolver.buffer = impulse;
			return convolver;
		}

		function triggerStepSynth() {
			if (steps[currentStep]) {
				const osc = audioCtx.createOscillator();
				const gain = audioCtx.createGain();
				osc.type = waveformSelect.value;
				osc.frequency.setValueAtTime(freqSlider.value, audioCtx.currentTime);
				osc.detune.setValueAtTime(detuneSlider.value, audioCtx.currentTime);
				gain.gain.setValueAtTime(volSlider.value, audioCtx.currentTime);

				let finalNode = gain;
				if (reverbToggle.checked) {
					const stepConvolver = createReverb(audioCtx);
					gain.connect(stepConvolver);
					stepConvolver.connect(audioCtx.destination);
				} else {
					gain.connect(audioCtx.destination);
				}

				osc.connect(gain);
				osc.start();
				osc.stop(audioCtx.currentTime + 0.3);
			}
			const stepEls = document.querySelectorAll('.step');
			stepEls.forEach((el, i) => {
				el.classList.toggle('active', i === currentStep);
			});
			currentStep = (currentStep + 1) % 8;
		}

		function setupSequencer() {
			for (let i = 0; i < 8; i++) {
				const step = document.createElement('div');
				step.className = 'step';
				step.addEventListener('click', () => {
					steps[i] = !steps[i];
					step.style.backgroundColor = steps[i] ? '#00f7ff' : '#333';
				});
				sequencerEl.appendChild(step);
			}
		}

		setupSequencer();

		freqSlider.addEventListener('input', () => {
			freqValue.textContent = freqSlider.value;
			if (oscillator) oscillator.frequency.setValueAtTime(freqSlider.value, audioCtx.currentTime);
		});

		volSlider.addEventListener('input', () => {
			volValue.textContent = volSlider.value;
			if (gainNode) gainNode.gain.setValueAtTime(volSlider.value, audioCtx.currentTime);
		});

		detuneSlider.addEventListener('input', () => {
			detuneValue.textContent = detuneSlider.value;
			if (oscillator) oscillator.detune.setValueAtTime(detuneSlider.value, audioCtx.currentTime);
		});

		document.getElementById('start').addEventListener('click', () => {
			if (!isPlaying) {
				audioCtx = new AudioContext();
				oscillator = audioCtx.createOscillator();
				gainNode = audioCtx.createGain();

				oscillator.type = waveformSelect.value;
				oscillator.frequency.setValueAtTime(freqSlider.value, audioCtx.currentTime);
				oscillator.detune.setValueAtTime(detuneSlider.value, audioCtx.currentTime);
				gainNode.gain.setValueAtTime(volSlider.value, audioCtx.currentTime);

				let finalNode = gainNode;
				if (reverbToggle.checked) {
					convolver = createReverb(audioCtx);
					gainNode.connect(convolver);
					convolver.connect(audioCtx.destination);
				} else {
					gainNode.connect(audioCtx.destination);
				}

				oscillator.connect(gainNode);
				oscillator.start();
				isPlaying = true;

				stepInterval = setInterval(triggerStepSynth, 500);
			}
		});

		document.getElementById('stop').addEventListener('click', () => {
			if (isPlaying) {
				oscillator.stop();
				audioCtx.close();
				isPlaying = false;
				clearInterval(stepInterval);
				currentStep = 0;
			}
		});