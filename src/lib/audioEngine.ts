import { AudioPreset, DeveloperSettings, AudioRoutingMode } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // DSP Nodes (Core mono chain)
  private highPassFilter: BiquadFilterNode | null = null;
  private gateNode: ScriptProcessorNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  
  // Advanced Stereo & Spatializer Nodes
  private splitterNode: ChannelSplitterNode | null = null;
  private haasDelayNode: DelayNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  
  // Advanced Parallel Reverb Send Nodes
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  
  private analyserNode: AnalyserNode | null = null;
  
  // Recording
  private mediaDestination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private recordingDuration: number = 0;
  private isRecordingActive: boolean = false;

  // Parameters
  private preset: AudioPreset;
  private devSettings: DeveloperSettings;
  private isMuted: boolean = false;
  private isActive: boolean = false;
  private routingMode: AudioRoutingMode = 'headphones';
  private customHaasDelay: number = 0.018;

  constructor(preset: AudioPreset, devSettings: DeveloperSettings) {
    this.preset = preset;
    this.devSettings = devSettings;
  }

  /**
   * Generates a beautifully lush virtual room impulse response buffer for the convolution reverb
   */
  private createReverbImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext is not active");
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const percent = i / length;
      // Exponential decay envelope
      const decayFactor = Math.exp(-percent * decay);
      // Generate randomized stereo-uncorrelated white noise to produce lush room width
      left[i] = (Math.random() * 2 - 1) * decayFactor;
      right[i] = (Math.random() * 2 - 1) * decayFactor;
    }
    return impulse;
  }

  /**
   * Dynamically rebuilds and connects the audio graph nodes on the fly.
   * This allows turning Haas stereo, Reverb level, EQ bands, and Gate on/off with zero audio dropouts.
   */
  public reconnectDSP() {
    if (!this.ctx || !this.source || !this.highPassFilter || !this.gateNode || !this.eqFilters || !this.gainNode || !this.compressorNode || !this.analyserNode) {
      return;
    }

    try {
      // 1. Break all existing connections in the graph to prevent leaks or duplicates
      this.source.disconnect();
      this.highPassFilter.disconnect();
      this.gateNode.disconnect();
      this.eqFilters.forEach(f => f.disconnect());
      this.gainNode.disconnect();
      this.compressorNode.disconnect();
      
      if (this.splitterNode) this.splitterNode.disconnect();
      if (this.haasDelayNode) this.haasDelayNode.disconnect();
      if (this.mergerNode) this.mergerNode.disconnect();
      
      if (this.reverbNode) this.reverbNode.disconnect();
      if (this.reverbWetGain) this.reverbWetGain.disconnect();
      if (this.reverbDryGain) this.reverbDryGain.disconnect();
      
      this.analyserNode.disconnect();

      // 2. Build the standard vocal preprocessing chain (Mono)
      this.source.connect(this.highPassFilter);
      this.highPassFilter.connect(this.gateNode);
      
      let lastNode: AudioNode = this.gateNode;
      this.eqFilters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      lastNode.connect(this.gainNode);
      this.gainNode.connect(this.compressorNode);
      
      const monoVocalOutput: AudioNode = this.compressorNode;

      // 3. Apply Haas Stereo Widening (3D binaural effect for headsets)
      const hasStereo = !!this.preset.stereoHaas;
      let spatializedOutput: AudioNode;

      if (hasStereo) {
        if (!this.splitterNode) this.splitterNode = this.ctx.createChannelSplitter(2);
        if (!this.haasDelayNode) this.haasDelayNode = this.ctx.createDelay(0.1);
        if (!this.mergerNode) this.mergerNode = this.ctx.createChannelMerger(2);

        // Dynamic Haas delay right channel offset for customized sound width
        this.haasDelayNode.delayTime.setValueAtTime(this.customHaasDelay, this.ctx.currentTime);

        monoVocalOutput.connect(this.splitterNode);

        // Connect Left Channel directly
        this.splitterNode.connect(this.mergerNode, 0, 0);

        // Connect Right Channel with subtle delay to create a gorgeous stereo stage
        this.splitterNode.connect(this.haasDelayNode, 0);
        this.haasDelayNode.connect(this.mergerNode, 0, 1);

        spatializedOutput = this.mergerNode;
      } else {
        spatializedOutput = monoVocalOutput;
      }

      // 4. Parallel Studio Reverb Send Routing
      const reverbWet = this.preset.reverbWet !== undefined ? this.preset.reverbWet : 0;
      
      if (reverbWet > 0) {
        if (!this.reverbNode) {
          this.reverbNode = this.ctx.createConvolver();
          this.reverbNode.buffer = this.createReverbImpulseResponse(1.5, 4.5); // Warm, tight studio reverb
        }
        if (!this.reverbWetGain) this.reverbWetGain = this.ctx.createGain();
        if (!this.reverbDryGain) this.reverbDryGain = this.ctx.createGain();

        this.reverbWetGain.gain.setValueAtTime(reverbWet, this.ctx.currentTime);
        this.reverbDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime); // keep vocal presence sharp

        // Dry signal path
        spatializedOutput.connect(this.reverbDryGain);
        this.reverbDryGain.connect(this.analyserNode);

        // Wet convolution path
        spatializedOutput.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbWetGain);
        this.reverbWetGain.connect(this.analyserNode);
      } else {
        // Direct route to visualizer & master output
        spatializedOutput.connect(this.analyserNode);
      }

      // 5. Connect Analyser Node to hardware speakers and recording stream
      this.analyserNode.connect(this.ctx.destination);
      if (this.mediaDestination) {
        this.analyserNode.connect(this.mediaDestination);
      }
    } catch (err) {
      console.warn("Failed to dynamically route DSP nodes:", err);
    }
  }

  /**
   * Initializes and starts the audio processing chain
   */
  async start(onStateChange?: (active: boolean, error?: string) => void): Promise<boolean> {
    if (this.isActive) return true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({
        latencyHint: this.devSettings.latencyHint,
      });

      // Adaptive Microphone Constraints:
      // If we use 'studioHighFi' mode, we completely turn OFF native browser echo cancellation,
      // noise suppression, and auto gain. This bypasses the compressed zoom-like vocal sound
      // and retrieves full-bandwidth 48kHz raw mic signals, perfect for studio headphones!
      const rawStudioMic = !!this.preset.studioHighFi;

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: rawStudioMic ? false : this.devSettings.echoCancellation,
          noiseSuppression: rawStudioMic ? false : this.devSettings.noiseSuppression,
          autoGainControl: rawStudioMic ? false : this.devSettings.autoGainControl,
        },
        video: false
      });

      this.source = this.ctx.createMediaStreamSource(this.stream);

      // 1. High Pass Filter (Cuts low-end fan rumbles, wind, AC hums)
      this.highPassFilter = this.ctx.createBiquadFilter();
      this.highPassFilter.type = 'highpass';
      this.highPassFilter.frequency.setValueAtTime(this.devSettings.highPassFilterFreq, this.ctx.currentTime);

      // 2. High-Precision Noise Gate Node
      const bufferSize = this.devSettings.fftSize;
      this.gateNode = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      
      let lastLevel = 1.0;
      const smoothing = 0.90; // High envelope smoothing to avoid volume chattering/clicking

      this.gateNode.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);
        
        const enabled = this.preset.noiseCancellation;
        const gateThreshold = this.preset.noiseGateThreshold;

        if (!enabled) {
          for (let i = 0; i < input.length; i++) {
            output[i] = input[i];
          }
          return;
        }

        // Calculate peak amplitude (RMS) in dB
        let peakSum = 0;
        for (let i = 0; i < input.length; i++) {
          peakSum += input[i] * input[i];
        }
        const rms = Math.sqrt(peakSum / input.length);
        const db = 20 * Math.log10(rms || 1e-10);

        // Smooth gate threshold response
        const targetGain = db < gateThreshold ? 0.0 : 1.0;
        
        for (let i = 0; i < input.length; i++) {
          lastLevel = lastLevel * smoothing + targetGain * (1 - smoothing);
          output[i] = input[i] * lastLevel;
        }
      };

      // 3. Multi-band Studio Equalizer (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz)
      const eqFrequencies = [60, 230, 910, 3600, 14000];
      this.eqFilters = eqFrequencies.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === eqFrequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = this.getEqGainFromPreset(freq);
        return filter;
      });

      // 4. Main Gain node (with instant mute support)
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.preset.gain, this.ctx.currentTime);

      // 5. Studio compressor (Whisper booster & dynamic limiter)
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.updateCompressorSettings();

      // 6. Visual Analyser
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = this.devSettings.fftSize;

      // 7. Output recorder destination
      this.mediaDestination = this.ctx.createMediaStreamDestination();

      // Hook up the live dynamic routing network
      this.reconnectDSP();

      this.isActive = true;
      if (onStateChange) onStateChange(true);
      return true;
    } catch (err: any) {
      console.error("Audio Engine failed to start:", err);
      if (onStateChange) onStateChange(false, err.message || "Microphone access denied");
      return false;
    }
  }

  /**
   * Stops the audio context and releases the microphone stream
   */
  stop(onStateChange?: (active: boolean) => void) {
    if (this.isRecordingActive) {
      this.stopRecording();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.ctx) {
      if (this.ctx.state !== 'closed') {
        this.ctx.close();
      }
      this.ctx = null;
    }

    this.source = null;
    this.highPassFilter = null;
    this.gateNode = null;
    this.eqFilters = [];
    this.gainNode = null;
    this.compressorNode = null;
    
    this.splitterNode = null;
    this.haasDelayNode = null;
    this.mergerNode = null;
    this.reverbNode = null;
    this.reverbWetGain = null;
    this.reverbDryGain = null;
    
    this.analyserNode = null;
    this.mediaDestination = null;

    this.isActive = false;
    if (onStateChange) onStateChange(false);
  }

  /**
   * Applies the selected preset gains to EQ and Gate nodes in real-time
   */
  updatePreset(preset: AudioPreset) {
    this.preset = preset;
    
    // Update gain volume
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(preset.gain, this.ctx?.currentTime || 0);
    }

    // Update EQ filters
    if (this.eqFilters.length === 5) {
      this.eqFilters[0].gain.setValueAtTime(preset.eq60, this.ctx?.currentTime || 0);
      this.eqFilters[1].gain.setValueAtTime(preset.eq230, this.ctx?.currentTime || 0);
      this.eqFilters[2].gain.setValueAtTime(preset.eq910, this.ctx?.currentTime || 0);
      this.eqFilters[3].gain.setValueAtTime(preset.eq3600, this.ctx?.currentTime || 0);
      this.eqFilters[4].gain.setValueAtTime(preset.eq14000, this.ctx?.currentTime || 0);
    }

    // Rebuild or update the dynamic Haas stereo and Reverb Send paths
    this.reconnectDSP();
  }

  /**
   * Dynamically alters audio characteristics based on selected routing mode
   */
  updateRoutingMode(mode: AudioRoutingMode) {
    this.routingMode = mode;
    if (!this.ctx) return;

    try {
      if (mode === 'receiver') {
        // Handset/earpiece simulation: boost vocal midrange, roll off low-end rumble and high air hiss
        if (this.highPassFilter) {
          this.highPassFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
        }
        if (this.eqFilters.length === 5) {
          this.eqFilters[0].gain.setValueAtTime(-12, this.ctx.currentTime); // 60Hz cut
          this.eqFilters[1].gain.setValueAtTime(6, this.ctx.currentTime);   // 230Hz boost
          this.eqFilters[2].gain.setValueAtTime(6, this.ctx.currentTime);   // 910Hz boost
          this.eqFilters[3].gain.setValueAtTime(2, this.ctx.currentTime);   // 3.6kHz slight boost
          this.eqFilters[4].gain.setValueAtTime(-10, this.ctx.currentTime); // 14kHz cut
        }
      } else if (mode === 'bluetooth') {
        // Bluetooth Wireless Optimization: lower treble slightly to avoid wireless clipping, apply high low-cut
        if (this.highPassFilter) {
          this.highPassFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
        }
        if (this.eqFilters.length === 5) {
          this.eqFilters[0].gain.setValueAtTime(this.preset.eq60, this.ctx.currentTime);
          this.eqFilters[1].gain.setValueAtTime(this.preset.eq230, this.ctx.currentTime);
          this.eqFilters[2].gain.setValueAtTime(this.preset.eq910, this.ctx.currentTime);
          this.eqFilters[3].gain.setValueAtTime(this.preset.eq3600 - 2, this.ctx.currentTime);
          this.eqFilters[4].gain.setValueAtTime(this.preset.eq14000 - 3, this.ctx.currentTime);
        }
      } else if (mode === 'speaker') {
        // Speakerphone environmental room capture: boost overall sensitivity, light noise-cut
        if (this.highPassFilter) {
          this.highPassFilter.frequency.setValueAtTime(60, this.ctx.currentTime);
        }
        if (this.eqFilters.length === 5) {
          this.eqFilters[0].gain.setValueAtTime(this.preset.eq60 + 2, this.ctx.currentTime);
          this.eqFilters[1].gain.setValueAtTime(this.preset.eq230 + 1, this.ctx.currentTime);
          this.eqFilters[2].gain.setValueAtTime(this.preset.eq910 + 2, this.ctx.currentTime);
          this.eqFilters[3].gain.setValueAtTime(this.preset.eq3600, this.ctx.currentTime);
          this.eqFilters[4].gain.setValueAtTime(this.preset.eq14000, this.ctx.currentTime);
        }
      } else {
        // Wired headphones / High-fidelity pro monitor: load standard preset gains perfectly
        if (this.highPassFilter) {
          this.highPassFilter.frequency.setValueAtTime(this.devSettings.highPassFilterFreq, this.ctx.currentTime);
        }
        if (this.eqFilters.length === 5) {
          this.eqFilters[0].gain.setValueAtTime(this.preset.eq60, this.ctx.currentTime);
          this.eqFilters[1].gain.setValueAtTime(this.preset.eq230, this.ctx.currentTime);
          this.eqFilters[2].gain.setValueAtTime(this.preset.eq910, this.ctx.currentTime);
          this.eqFilters[3].gain.setValueAtTime(this.preset.eq3600, this.ctx.currentTime);
          this.eqFilters[4].gain.setValueAtTime(this.preset.eq14000, this.ctx.currentTime);
        }
      }
      this.reconnectDSP();
    } catch (e) {
      console.warn("Error updating dynamic routing mode DSP:", e);
    }
  }

  /**
   * Update individual EQ band gain
   */
  updateEqBand(freq: number, gainValue: number) {
    if (freq === 60) this.preset.eq60 = gainValue;
    else if (freq === 230) this.preset.eq230 = gainValue;
    else if (freq === 910) this.preset.eq910 = gainValue;
    else if (freq === 3600) this.preset.eq3600 = gainValue;
    else if (freq === 14000) this.preset.eq14000 = gainValue;

    const filter = this.eqFilters.find(f => Math.round(f.frequency.value) === freq);
    if (filter) {
      filter.gain.setValueAtTime(gainValue, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Update Gain Booster Volume directly
   */
  updateGain(gainValue: number) {
    this.preset.gain = gainValue;
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(gainValue, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Toggles noise cancellation gate on/off
   */
  updateNoiseCancellation(enabled: boolean) {
    this.preset.noiseCancellation = enabled;
  }

  /**
   * Update Noise Gate Threshold DB
   */
  updateNoiseGateThreshold(threshold: number) {
    this.preset.noiseGateThreshold = threshold;
  }

  /**
   * Toggles Haas Stereo Width
   */
  updateStereoHaas(enabled: boolean) {
    this.preset.stereoHaas = enabled;
    this.reconnectDSP();
  }

  /**
   * Updates Haas Stereo Delay right channel delay offset in seconds
   */
  updateHaasDelayTime(seconds: number) {
    this.customHaasDelay = seconds;
    if (this.haasDelayNode && this.ctx) {
      this.haasDelayNode.delayTime.setValueAtTime(seconds, this.ctx.currentTime);
    }
  }

  /**
   * Update Reverb Send wet mix percentage
   */
  updateReverbWet(wetValue: number) {
    this.preset.reverbWet = wetValue;
    if (this.reverbWetGain && this.ctx) {
      this.reverbWetGain.gain.setValueAtTime(wetValue, this.ctx.currentTime);
    } else {
      this.reconnectDSP();
    }
  }

  /**
   * Updates advanced developer settings
   */
  updateDevSettings(settings: DeveloperSettings) {
    this.devSettings = settings;

    if (this.highPassFilter) {
      this.highPassFilter.frequency.setValueAtTime(settings.highPassFilterFreq, this.ctx?.currentTime || 0);
    }

    if (this.analyserNode) {
      this.analyserNode.fftSize = settings.fftSize;
    }

    this.updateCompressorSettings();
  }

  /**
   * Helper to set Compressor parameters
   */
  private updateCompressorSettings() {
    if (!this.compressorNode || !this.ctx) return;

    if (this.preset.compressorEnabled) {
      this.compressorNode.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressorNode.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressorNode.ratio.setValueAtTime(this.devSettings.compressorRatio, this.ctx.currentTime);
      this.compressorNode.attack.setValueAtTime(this.devSettings.compressorAttack, this.ctx.currentTime);
      this.compressorNode.release.setValueAtTime(this.devSettings.compressorRelease, this.ctx.currentTime);
    } else {
      this.compressorNode.threshold.setValueAtTime(0, this.ctx.currentTime);
      this.compressorNode.ratio.setValueAtTime(1, this.ctx.currentTime);
    }
  }

  /**
   * Mute / Unmute the main speaker output (keeping visual analyser running)
   */
  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.gainNode) {
      const targetGain = mute ? 0 : this.preset.gain;
      this.gainNode.gain.setValueAtTime(targetGain, this.ctx?.currentTime || 0);
    }
  }

  /**
   * Get FFT analyser node for visualizations
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- RECORDING OPERATIONS ---

  /**
   * Starts capturing the audio to a file recording
   */
  startRecording(): boolean {
    if (!this.isActive || !this.mediaDestination) {
      console.warn("Audio Engine must be active to start recording.");
      return false;
    }

    if (this.isRecordingActive) return true;

    try {
      this.recordedChunks = [];
      this.recordingStartTime = Date.now();
      
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/ogg;codecs=opus' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: '' };
      }

      this.mediaRecorder = new MediaRecorder(this.mediaDestination.stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);
      this.isRecordingActive = true;
      return true;
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      return false;
    }
  }

  /**
   * Stops recording and returns the final audio file blob with its metadata
   */
  stopRecording(): Promise<{ blob: Blob; duration: number } | null> {
    return new Promise((resolve) => {
      if (!this.isRecordingActive || !this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.recordingDuration = (Date.now() - this.recordingStartTime) / 1000;
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        
        this.isRecordingActive = false;
        this.mediaRecorder = null;
        resolve({ blob, duration: this.recordingDuration });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.isRecordingActive;
  }

  getRecordingElapsedSeconds(): number {
    if (!this.isRecordingActive) return 0;
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Sound utility: Returns real-time decibels of the processing chain
   */
  getDecibelLevel(): number {
    if (!this.analyserNode) return -100;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.round((avg / 255) * 100) - 100;
  }

  private getEqGainFromPreset(freq: number): number {
    if (freq === 60) return this.preset.eq60;
    if (freq === 230) return this.preset.eq230;
    if (freq === 910) return this.preset.eq910;
    if (freq === 3600) return this.preset.eq3600;
    if (freq === 14000) return this.preset.eq14000;
    return 0;
  }
}
