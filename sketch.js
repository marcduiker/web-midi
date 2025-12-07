let midiAccess = null;
let midiOutput = null;
let midiSelector;
let webcamSelector;
let videoDevices = [];
let capture;
let noteAnimations = [];
let currentNote = null;
let statusDiv;
let sseStatusDiv;
let instructionsDiv;
let eventSource; // SSE connection

// Audio analysis
let mic;
let fft;

let videoWidth;
let videoHeight;
let videoOffsetX;
let videoOffsetY;

const ANIMATION_CONFIG = {
  circleSize: 60,
  circleColor: 255,
  textSize: 16,
  speed: 2,
  maxAge: 180,
  startAlpha: 255,
  endAlpha: 0,
  randomXRange: true
};

const MIDI_NOTE_MIN = 48;  // C3
const MIDI_NOTE_MAX = 60;  // C4
const MIDI_CHANNEL = 1;
const MIDI_VELOCITY = 100;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function setup() {
  createCanvas(windowWidth, windowHeight);
  calculateVideoDimensions();
  
  // Enumerate video devices first, then create capture
  enumerateVideoDevices();
  
  initMIDI();
  createMIDISelector();
  createWebcamSelector();
  createStatusIndicator();
  createSSEStatusIndicator();
  createInstructions();
  initSSE();
  initAudio();
}

function draw() {
  background(0);
  
  if (capture) {
    image(capture, videoOffsetX, videoOffsetY, videoWidth, videoHeight);
  }
  
  // Draw waveform overlay
  drawWaveform();
  
  updateNoteAnimations();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateVideoDimensions();
  if (capture) {
    capture.size(videoWidth, videoHeight);
  }
}

function calculateVideoDimensions() {
  const aspectRatio = 16 / 9;
  
  // Calculate dimensions to fit 16:9 within window
  if (windowWidth / windowHeight > aspectRatio) {
    // Window is wider than 16:9, fit to height
    videoHeight = windowHeight;
    videoWidth = videoHeight * aspectRatio;
  } else {
    // Window is taller than 16:9, fit to width
    videoWidth = windowWidth;
    videoHeight = videoWidth / aspectRatio;
  }

  videoOffsetX = (windowWidth - videoWidth) / 2;
  videoOffsetY = (windowHeight - videoHeight) / 2;
}

function mousePressed() {
  // Check if mouse is within canvas bounds but outside UI element areas
  // Exclude top 100px where UI elements are located
  if (mouseX >= 0 && mouseX <= width && mouseY >= 100 && mouseY <= height) {
    // Generate random MIDI note between C3 and C4
    const note = floor(random(MIDI_NOTE_MIN, MIDI_NOTE_MAX + 1));
    sendNoteOn(note);
    
    if (instructionsDiv) {
      instructionsDiv.addClass('hidden');
    }
    
    return false;
  }
}

function mouseReleased() {
  // Send note off for currently playing note
  if (currentNote !== null) {
    sendNoteOff(currentNote);
    
    // Find and release the active animation for this note
    for (let anim of noteAnimations) {
      if (anim.midiNumber === currentNote && anim.isActive) {
        anim.release();
        break;
      }
    }
    
    currentNote = null;
    return false;
  }
}

function initMIDI() {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
      .then(onMIDISuccess, onMIDIFailure);
  } else {
    console.error('Web MIDI API not supported in this browser');
    updateStatus('MIDI not supported', false);
  }
}

function onMIDISuccess(midi) {
  midiAccess = midi;
  console.log('MIDI Access obtained');
  const outputs = Array.from(midiAccess.outputs.values());
  
  if (outputs.length > 0) {
    midiOutput = outputs[0];
    console.log('MIDI Output:', midiOutput.name);
    updateStatus(`Connected: ${midiOutput.name}`, true);
    populateMIDISelector(outputs);
  } else {
    console.warn('No MIDI outputs available');
    updateStatus('No MIDI devices found', false);
  }

  outputs.forEach((output, index) => {
    console.log(`Output ${index}: ${output.name}`);
  });
}

function onMIDIFailure(error) {
  console.error('Failed to get MIDI access:', error);
  updateStatus('MIDI access denied', false);
}

function sendNoteOn(midiNumber) {
  if (!midiOutput) {
    console.error('No MIDI output available');
    return;
  }
  
  // Calculate MIDI status byte for Note On
  const noteOnStatus = 0x90 | (MIDI_CHANNEL - 1);
  
  midiOutput.send([noteOnStatus, midiNumber, MIDI_VELOCITY]);
  console.log(`Note On: Channel ${MIDI_CHANNEL}, Note ${midiNumber} (${midiNumberToNoteName(midiNumber)}), Velocity ${MIDI_VELOCITY}`);

  currentNote = midiNumber;
  
  createNoteAnimation(midiNumberToNoteName(midiNumber), midiNumber);
}

function sendNoteOff(midiNumber) {
  if (!midiOutput) {
    console.error('No MIDI output available');
    return;
  }
  
  // Calculate MIDI status byte for Note Off
  const noteOffStatus = 0x80 | (MIDI_CHANNEL - 1);
  
  midiOutput.send([noteOffStatus, midiNumber, 0]);
  console.log(`Note Off: Channel ${MIDI_CHANNEL}, Note ${midiNumber} (${midiNumberToNoteName(midiNumber)})`);
}

function midiNumberToNoteName(midiNumber) {
  const octave = floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[midiNumber % 12];
  return noteName + octave;
}

function noteNameToMidiNumber(noteName) {
  // Parse note name like "C3", "D#4", etc.
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) {
    console.error('Invalid note name:', noteName);
    return null;
  }
  
  const note = match[1];
  const octave = parseInt(match[2]);
  
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) {
    console.error('Invalid note:', note);
    return null;
  }
  
  return (octave + 1) * 12 + noteIndex;
}

function createStatusIndicator() {
  statusDiv = createDiv('Connecting to MIDI...');
  statusDiv.class('status-indicator');
  statusDiv.position(20, 20);
}

function updateStatus(message, isConnected) {
  if (statusDiv) {
    statusDiv.html(message);
    if (isConnected) {
      statusDiv.class('status-indicator status-connected');
    } else {
      statusDiv.class('status-indicator status-disconnected');
    }
  }
}

function createSSEStatusIndicator() {
  sseStatusDiv = createDiv('Connecting to SSE...');
  sseStatusDiv.class('sse-status-indicator');
  sseStatusDiv.position(windowWidth / 2 + 20, 20);
}

function updateSSEStatus(message, isConnected) {
  if (sseStatusDiv) {
    sseStatusDiv.html(message);
    if (isConnected) {
      sseStatusDiv.class('sse-status-indicator status-connected');
    } else {
      sseStatusDiv.class('sse-status-indicator status-disconnected');
    }
  }
}

function createInstructions() {
  instructionsDiv = createDiv('Click and hold anywhere to play random MIDI notes');
  instructionsDiv.class('instructions');
  instructionsDiv.position(windowWidth / 2, windowHeight - 70);
}

// ============================================
// Server-Sent Events (SSE)
// ============================================
function initSSE() {
  const sseUrl = 'http://localhost:5500/events';
  console.log('Connecting to SSE:', sseUrl);
  
  eventSource = new EventSource(sseUrl);
  
  eventSource.onopen = function() {
    console.log('SSE connection opened');
    updateSSEStatus('SSE Connected', true);
  };
  
  eventSource.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('SSE event received:', data);
      handleSSENote(data);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
  };
  
  eventSource.onerror = function(error) {
    console.error('SSE connection error:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('SSE connection closed, attempting to reconnect...');
      updateSSEStatus('SSE Disconnected', false);
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      updateSSEStatus('SSE Connecting...', false);
    } else {
      updateSSEStatus('SSE Error', false);
    }
  };
}

function handleSSENote(data) {
  if (!data.note || !data.duration) {
    console.error('Invalid SSE data, missing note or duration:', data);
    return;
  }
  
  const midiNumber = noteNameToMidiNumber(data.note);
  if (midiNumber === null) {
    return;
  }
  
  console.log(`Playing SSE note: ${data.note} (MIDI ${midiNumber}) for ${data.duration}ms`);
  
  // Send Note On
  sendNoteOn(midiNumber);
  
  // Schedule Note Off after duration
  setTimeout(() => {
    sendNoteOff(midiNumber);
    
    // Find and release the animation for this note
    for (let anim of noteAnimations) {
      if (anim.midiNumber === midiNumber && anim.isActive) {
        anim.release();
        break;
      }
    }
  }, data.duration);
}

// ============================================
// Audio Analysis
// ============================================
function initAudio() {
  // Create microphone input
  mic = new p5.AudioIn();
  mic.start();
  
  // Create FFT analyzer with 256 bins
  fft = new p5.FFT(0, 128);
  fft.setInput(mic);
  
  console.log('Microphone and FFT analyzer initialized');
}

function drawWaveform() {
  if (!fft) return;
  
  // Get waveform data
  let waveform = fft.waveform();
  
  // Draw waveform across full screen width
  push();
  noFill();
  stroke(255); // White stroke
  strokeWeight(2);
  
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    // Map i to x position across full width
    let x = map(i, 0, waveform.length - 1, 0, windowWidth);
    
    // Map waveform value to y position in middle of screen
    let y = map(waveform[i], -1, 1, windowHeight, 0);
    
    vertex(x, y);
  }
  endShape();
  
  pop();
}

function createMIDISelector() {
  midiSelector = createSelect();
  midiSelector.position(20, 60);
  midiSelector.class('midi-selector');
  midiSelector.option('No MIDI devices');
  midiSelector.disable();
  midiSelector.changed(onMIDIDeviceChange);
}

function populateMIDISelector(outputs) {
  if (!midiSelector) return;
  
  // Clear existing options
  midiSelector.html('');
  
  // Add all MIDI outputs to the selector
  outputs.forEach((output, index) => {
    midiSelector.option(output.name, index);
  });
  
  // Enable the selector
  midiSelector.enable();
  
  // Set the first device as selected
  midiSelector.selected(0);
}

function onMIDIDeviceChange() {
  const selectedIndex = parseInt(midiSelector.value());
  const outputs = Array.from(midiAccess.outputs.values());
  
  if (selectedIndex >= 0 && selectedIndex < outputs.length) {
    midiOutput = outputs[selectedIndex];
    console.log('Switched to MIDI Output:', midiOutput.name);
    updateStatus(`Connected: ${midiOutput.name}`, true);
  }
}

function createWebcamSelector() {
  webcamSelector = createSelect();
  webcamSelector.position(240, 60);
  webcamSelector.class('webcam-selector');
  webcamSelector.option('Loading cameras...');
  webcamSelector.disable();
  webcamSelector.changed(onWebcamDeviceChange);
}

function enumerateVideoDevices() {
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Video devices found:', videoDevices.length);
      
      if (videoDevices.length > 0) {
        populateWebcamSelector();
        // Create capture with first device
        createWebcamCapture(videoDevices[0].deviceId);
      } else {
        console.warn('No video devices found');
      }
    })
    .catch(err => {
      console.error('Error enumerating devices:', err);
    });
}

function populateWebcamSelector() {
  if (!webcamSelector) return;
  
  // Clear existing options
  webcamSelector.html('');
  
  // Add all video devices to the selector
  videoDevices.forEach((device, index) => {
    const label = device.label || `Camera ${index + 1}`;
    webcamSelector.option(label, index);
  });
  
  // Enable the selector
  webcamSelector.enable();
  
  // Set the first device as selected
  webcamSelector.selected(0);
}

function onWebcamDeviceChange() {
  const selectedIndex = parseInt(webcamSelector.value());
  
  if (selectedIndex >= 0 && selectedIndex < videoDevices.length) {
    const deviceId = videoDevices[selectedIndex].deviceId;
    console.log('Switching to camera:', videoDevices[selectedIndex].label || deviceId);
    
    // Remove old capture
    if (capture) {
      capture.remove();
    }
    
    // Create new capture with selected device
    createWebcamCapture(deviceId);
  }
}

function createWebcamCapture(deviceId) {
  capture = createCapture({
    video: {
      deviceId: { exact: deviceId },
      aspectRatio: 16/9
    }
  });
  capture.size(videoWidth, videoHeight);
  capture.hide();
}

// ============================================
// Note Animation System
// ============================================
class NoteAnimation {
  constructor(noteName, x, y, midiNumber) {
    this.note = noteName;
    this.midiNumber = midiNumber;
    this.x = x;
    this.y = y;
    this.targetY = 0;
    this.alpha = ANIMATION_CONFIG.startAlpha;
    this.circleSize = ANIMATION_CONFIG.circleSize;
    this.speed = ANIMATION_CONFIG.speed;
    this.age = 0;
    this.maxAge = ANIMATION_CONFIG.maxAge;
    this.isActive = true; // Note is being held
    this.releaseAge = null; // Age when note was released
  }
  
  update() {
    // Move upward
    this.y -= this.speed;
    
    // Update age
    this.age++;
    
    // Only start fading after note is released
    if (!this.isActive) {
      if (this.releaseAge === null) {
        this.releaseAge = this.age;
      }
      const fadeAge = this.age - this.releaseAge;
      this.alpha = map(fadeAge, 0, this.maxAge, ANIMATION_CONFIG.startAlpha, ANIMATION_CONFIG.endAlpha);
    }
  }
  
  release() {
    this.isActive = false;
  }
  
  display() {
    push();
    
    // Set transparency
    fill(ANIMATION_CONFIG.circleColor, this.alpha);
    stroke(ANIMATION_CONFIG.circleColor, this.alpha);
    strokeWeight(2);
    
    // Draw circle
    circle(this.x, this.y, this.circleSize);
    
    // Draw note text
    noStroke();
    fill(0, this.alpha); // Black text
    textAlign(CENTER, CENTER);
    textSize(ANIMATION_CONFIG.textSize);
    text(this.note, this.x, this.y);
    
    pop();
  }
  
  isDead() {
    // Only die if released and faded out, or if off screen
    if (this.y < -this.circleSize) return true;
    if (!this.isActive && this.releaseAge !== null) {
      const fadeAge = this.age - this.releaseAge;
      return fadeAge >= this.maxAge;
    }
    return false;
  }
}

function createNoteAnimation(noteName, midiNumber) {
  // Calculate X position based on MIDI note number within video area
  // Map C3 (48) to left edge of video, C4 (60) to right edge of video
  const padding = ANIMATION_CONFIG.circleSize / 2;
  let x = map(midiNumber, MIDI_NOTE_MIN, MIDI_NOTE_MAX, 
              videoOffsetX + padding, 
              videoOffsetX + videoWidth - padding);
  
  let y = videoOffsetY + videoHeight - ANIMATION_CONFIG.circleSize;
  
  noteAnimations.push(new NoteAnimation(noteName, x, y, midiNumber));
}

function updateNoteAnimations() {
  // Update and display all animations
  for (let i = noteAnimations.length - 1; i >= 0; i--) {
    noteAnimations[i].update();
    noteAnimations[i].display();
    
    // Remove dead animations
    if (noteAnimations[i].isDead()) {
      noteAnimations.splice(i, 1);
    }
  }
}
