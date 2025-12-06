let midiAccess = null;
let midiOutput = null;
let midiSelector;
let webcamSelector;
let videoDevices = [];
let capture;
let noteAnimations = [];
let currentNote = null;
let statusDiv;
let instructionsDiv;

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
  createInstructions();
}

function draw() {
  background(0);
  
  if (capture) {
    image(capture, videoOffsetX, videoOffsetY, videoWidth, videoHeight);
  }
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
    
    // Hide instructions after first interaction
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

function createInstructions() {
  instructionsDiv = createDiv('Select a MIDI device and click and hold anywhere to play random MIDI notes');
  instructionsDiv.class('instructions');
  instructionsDiv.position(windowWidth / 2, windowHeight - 70);
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
