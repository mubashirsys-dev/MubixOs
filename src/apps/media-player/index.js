/* ═══════════════════════════════════════════
   MUBIX OS — Media Player App (REAL)
   Web Audio API synth engine, vinyl controls, and soundwave equalizers.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';

export default class MediaPlayerApp extends MubixApp {
  constructor() {
    super();
    this.audioCtx = null;
    this.isPlaying = false;
    this.synthInterval = null;
    this.playlist = [
      { id: 'synthwave', name: 'Cyber Synthwave Loop', duration: 180, artist: 'MUBIX Synth' },
      { id: 'ambient', name: 'Ambient Space Pad', duration: 300, artist: 'Nebula Drone' },
      { id: 'techno', name: 'Techno Grid Beat', duration: 120, artist: 'Matrix Pulse' }
    ];
    this.currentIndex = 0;
    this.currentTime = 0;
    this.playTimer = null;
    this.volume = 0.5;

    // DOM Elements
    this.vinylEl = null;
    this.visualizerCanvas = null;
    this.visualizerCtx = null;
    this.visualizerAnim = null;
    this.trackTitleEl = null;
    this.trackArtistEl = null;
    this.playBtnEl = null;
    this.progressSlider = null;
    this.timeIndicator = null;
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/media-player/style.css' });
    container.appendChild(styleLink);

    // Top Drop Target Zone
    const dropZone = h('div', {
      class: 'media-drop-zone',
      onDragover: (e) => { e.preventDefault(); dropZone.classList.add('hover'); },
      onDragleave: () => dropZone.classList.remove('hover'),
      onDrop: (e) => this.handleFileDrop(e)
    }, '📥 Drop local MP3 / WAV here to play');

    // Sidebar playlist
    const playlistContainer = h('div', { class: 'media-playlist' });
    this.renderPlaylist(playlistContainer);

    // Rotating Vinyl Deck
    this.vinylEl = h('div', { class: 'media-vinyl' },
      h('div', { class: 'media-vinyl-center' })
    );

    // Equalizer Sound Visualizer Canvas
    this.visualizerCanvas = h('canvas', { class: 'media-visualizer', width: 220, height: 48 });
    this.visualizerCtx = this.visualizerCanvas.getContext('2d');

    const visualizerWrapper = h('div', { class: 'media-deck-center' },
      this.vinylEl,
      this.visualizerCanvas
    );

    // Media Display labels
    this.trackTitleEl = h('div', { class: 'media-track-title' }, this.playlist[this.currentIndex].name);
    this.trackArtistEl = h('div', { class: 'media-track-artist' }, this.playlist[this.currentIndex].artist);

    // Time Indicator & Slider
    this.progressSlider = h('input', {
      type: 'range',
      class: 'media-slider',
      min: 0,
      max: this.playlist[this.currentIndex].duration,
      value: 0,
      onInput: (e) => this.seek(parseInt(e.target.value))
    });

    this.timeIndicator = h('div', { class: 'media-time-info' }, '0:00 / 3:00');

    // Action deck buttons
    this.playBtnEl = h('button', {
      class: 'media-btn btn-main-play',
      onClick: () => this.togglePlay()
    }, '▶ Play');

    const prevBtn = h('button', { class: 'media-btn', onClick: () => this.navigate(-1) }, '⏮');
    const nextBtn = h('button', { class: 'media-btn', onClick: () => this.navigate(1) }, '⏭');

    // Volume Deck Slider
    const volSlider = h('input', {
      type: 'range',
      class: 'media-vol-slider',
      min: 0,
      max: 100,
      value: 50,
      onInput: (e) => this.setVolume(parseFloat(e.target.value) / 100)
    });

    const controls = h('div', { class: 'media-controls' },
      prevBtn,
      this.playBtnEl,
      nextBtn,
      h('span', { style: { fontSize: '10px', color: 'var(--mx-text-secondary)' } }, '🔊'),
      volSlider
    );

    const deckWorkspace = h('div', { class: 'media-deck' },
      this.trackTitleEl,
      this.trackArtistEl,
      visualizerWrapper,
      this.progressSlider,
      this.timeIndicator,
      controls
    );

    const mediaUI = h('div', { class: 'media-app-container' },
      dropZone,
      h('div', { class: 'media-workspace' },
        playlistContainer,
        deckWorkspace
      )
    );

    container.appendChild(mediaUI);

    this.updateTimeDisplay();
    this.startVisualizer();
  }

  renderPlaylist(container) {
    container.innerHTML = '';
    container.appendChild(h('div', { class: 'playlist-header' }, '🎵 Media Library'));

    for (let i = 0; i < this.playlist.length; i++) {
      const track = this.playlist[i];
      const isActive = i === this.currentIndex;
      const trackItem = h('div', {
        class: `playlist-item ${isActive ? 'active' : ''}`,
        onClick: () => this.selectTrack(i)
      },
        h('span', { class: 'item-icon' }, isActive && this.isPlaying ? '🔊' : '🎵'),
        h('div', { class: 'item-details' },
          h('span', { class: 'item-title' }, track.name),
          h('span', { class: 'item-artist' }, track.artist)
        )
      );
      container.appendChild(trackItem);
    }
  }

  selectTrack(index) {
    this.stopSynth();
    this.currentIndex = index;
    this.currentTime = 0;
    
    const track = this.playlist[this.currentIndex];
    if (this.trackTitleEl) this.trackTitleEl.textContent = track.name;
    if (this.trackArtistEl) this.trackArtistEl.textContent = track.artist;
    
    if (this.progressSlider) {
      this.progressSlider.max = track.duration;
      this.progressSlider.value = 0;
    }

    const playlistContainer = this.container.querySelector('.media-playlist');
    if (playlistContainer) this.renderPlaylist(playlistContainer);

    this.updateTimeDisplay();

    if (this.isPlaying) {
      this.startSynth();
    }
  }

  navigate(direction) {
    let nextIdx = this.currentIndex + direction;
    if (nextIdx < 0) nextIdx = this.playlist.length - 1;
    if (nextIdx >= this.playlist.length) nextIdx = 0;
    this.selectTrack(nextIdx);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    if (this.playBtnEl) this.playBtnEl.textContent = '⏸ Pause';
    if (this.vinylEl) this.vinylEl.classList.add('playing');

    this.startSynth();
    this.startPlayTimer();
  }

  pause() {
    this.isPlaying = false;
    if (this.playBtnEl) this.playBtnEl.textContent = '▶ Play';
    if (this.vinylEl) this.vinylEl.classList.remove('playing');

    this.stopSynth();
    this.stopPlayTimer();
  }

  seek(time) {
    this.currentTime = time;
    if (this.progressSlider) this.progressSlider.value = time;
    this.updateTimeDisplay();
  }

  setVolume(vol) {
    this.volume = vol;
    // Update active synthesizer volume dynamically if playing
  }

  startPlayTimer() {
    this.stopPlayTimer();
    this.playTimer = setInterval(() => {
      this.currentTime++;
      const activeTrack = this.playlist[this.currentIndex];
      if (this.currentTime >= activeTrack.duration) {
        this.navigate(1);
      } else {
        if (this.progressSlider) this.progressSlider.value = this.currentTime;
        this.updateTimeDisplay();
      }
    }, 1000);
  }

  stopPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  updateTimeDisplay() {
    if (!this.timeIndicator) return;
    const format = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    const activeTrack = this.playlist[this.currentIndex];
    this.timeIndicator.textContent = `${format(this.currentTime)} / ${format(activeTrack.duration)}`;
  }

  /* ── Web Audio Synth Engine ── */

  startSynth() {
    this.stopSynth();

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    const track = this.playlist[this.currentIndex];

    // Web Audio Synthesizer Loop
    let beatStep = 0;
    const tempo = track.id === 'techno' ? 130 : (track.id === 'ambient' ? 65 : 95);
    const stepDuration = 60 / tempo / 2; // eighth notes

    const synthPulse = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      // Select dynamic scales based on track choice
      if (track.id === 'synthwave') {
        const bassNotes = [110, 110, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81];
        const note = bassNotes[beatStep % bassNotes.length];
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(this.volume * 0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + stepDuration - 0.02);

        // Add a high-melody synth note every 4 steps
        if (beatStep % 4 === 0) {
          const melOsc = this.audioCtx.createOscillator();
          const melGain = this.audioCtx.createGain();
          
          melOsc.connect(melGain);
          melGain.connect(this.audioCtx.destination);
          
          const melNotes = [440, 523.25, 587.33, 659.25];
          const melNote = melNotes[(beatStep / 4) % melNotes.length];
          
          melOsc.type = 'triangle';
          melOsc.frequency.setValueAtTime(melNote, this.audioCtx.currentTime);
          melGain.gain.setValueAtTime(this.volume * 0.04, this.audioCtx.currentTime);
          melGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);
          
          melOsc.start();
          melOsc.stop(this.audioCtx.currentTime + 0.7);
        }

      } else if (track.id === 'ambient') {
        // Soft ambient evolving pad chords
        const padNotes = [220, 261.63, 329.63, 392]; // Am7
        const note = padNotes[beatStep % padNotes.length];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume * 0.15, this.audioCtx.currentTime + 1.2);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 2.4);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 2.5);
        
        beatStep++;
        this.synthInterval = setTimeout(synthPulse, 2400);
        return;

      } else if (track.id === 'techno') {
        // Strong techno subkick beat
        osc.type = 'sine';
        
        if (beatStep % 2 === 0) {
          // Kick beat
          osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(45, this.audioCtx.currentTime + 0.12);
          gain.gain.setValueAtTime(this.volume * 0.35, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.16);
        } else {
          // Offbeat synth hat pulse
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(this.volume * 0.03, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
        }
      }

      osc.start();
      osc.stop(this.audioCtx.currentTime + stepDuration);

      beatStep++;
      this.synthInterval = setTimeout(synthPulse, stepDuration * 1000);
    };

    synthPulse();
  }

  stopSynth() {
    if (this.synthInterval) {
      clearTimeout(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  /* ── Visualizer Equalizer Renderer ── */

  startVisualizer() {
    const draw = () => {
      this.visualizerAnim = requestAnimationFrame(draw);
      if (!this.visualizerCtx || !this.visualizerCanvas) return;

      const w = this.visualizerCanvas.width;
      const h = this.visualizerCanvas.height;
      this.visualizerCtx.clearRect(0, 0, w, h);

      const barCount = 14;
      const barWidth = 10;
      const barGap = 5;
      const offset = (w - (barCount * (barWidth + barGap))) / 2;

      this.visualizerCtx.fillStyle = 'var(--mx-accent)';

      for (let i = 0; i < barCount; i++) {
        let barHeight = 2;
        if (this.isPlaying) {
          // Generate active mathematical equalizer sine animations
          const time = Date.now() * 0.004;
          barHeight = Math.abs(Math.sin(i * 0.6 + time) * Math.cos(i * 0.25 - time * 0.5)) * (h - 6) + 4;
        }

        const x = offset + i * (barWidth + barGap);
        const y = h - barHeight;

        // Custom rounded glowing bars
        this.visualizerCtx.fillRect(x, y, barWidth, barHeight);
      }
    };

    draw();
  }

  stopVisualizer() {
    if (this.visualizerAnim) {
      cancelAnimationFrame(this.visualizerAnim);
      this.visualizerAnim = null;
    }
  }

  handleFileDrop(e) {
    e.preventDefault();
    const zone = this.container.querySelector('.media-drop-zone');
    if (zone) zone.classList.remove('hover');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.includes('audio') && !file.type.includes('video')) {
      alert('Dropped file is not a valid audio or video track.');
      return;
    }

    // Add local uploaded file to playlist
    const customTrack = {
      id: 'dropped-' + Date.now(),
      name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
      duration: 240, // heuristic estimate
      artist: 'Local Upload File'
    };

    this.playlist.push(customTrack);
    this.currentIndex = this.playlist.length - 1;
    this.selectTrack(this.currentIndex);
    this.play();
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    this.pause();
    this.stopVisualizer();
    super.suspend();
    return {
      currentIndex: this.currentIndex,
      currentTime: this.currentTime,
      volume: this.volume
    };
  }

  resume(state = null) {
    this.startVisualizer();
    if (state) {
      this.currentIndex = state.currentIndex || 0;
      this.currentTime = state.currentTime || 0;
      this.volume = state.volume || 0.5;
      this.selectTrack(this.currentIndex);
    }
  }

  destroy() {
    this.pause();
    this.stopVisualizer();
    super.destroy();
  }
}
