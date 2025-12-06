// Global variables
let midiAccess = null;
let midiOutput = null;
let midiSelector;
let capture;
let noteAnimations = [];
let currentNote = null;
let statusDiv;
let instructionsDiv;

// Video dimensions (16:9 aspect ratio)
let videoWidth;
let videoHeight;
let videoOffsetX;
let videoOffsetY;

// Animation configuration
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

// MIDI configuration
const MIDI_NOTE_MIN = 48;  // C3
const MIDI_NOTE_MAX = 60;  // C4
const MIDI_CHANNEL = 1;
const MIDI_VELOCITY = 100;

// Note name mapping
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ============================================
// P5js Setup
// ============================================
function setup() {
  // Create canvas matching window dimensions
  createCanvas(windowWidth, windowHeight);
  
  // Calculate 16:9 video dimensions
  calculateVideoDimensions();
  
  // Initialize webcam capture with 16:9 aspect ratio constraint
  capture = createCapture({
    video: {
      aspectRatio: 16/9
    }
  });
  capture.size(videoWidth, videoHeight);
  capture.hide(); // Hide the default video element
  
  // Initialize MIDI
  initMIDI();
  
  // Create MIDI device selector
  createMIDISelector();
  
  // Create status indicator
  createStatusIndicator();
  
  // Create instructions
  createInstructions();
}

// ============================================
// P5js Draw Loop
// ============================================
function draw() {
  // Draw black background
  background(0);
  
  // Draw webcam capture in 16:9 aspect ratio, centered vertically
  if (capture) {
    image(capture, videoOffsetX, videoOffsetY, videoWidth, videoHeight);
  }
  
  // Update and display all note animations
  updateNoteAnimations();
}

// ============================================
// Window Resize Handler
// ============================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateVideoDimensions();
  if (capture) {
    capture.size(videoWidth, videoHeight);
  }
}

// ============================================
// Video Dimension Calculator
// ============================================
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
  
  // Calculate offsets to center the video
  videoOffsetX = (windowWidth - videoWidth) / 2;
  videoOffsetY = (windowHeight - videoHeight) / 2;
}

// ============================================
// Mouse Event Handlers
// ============================================
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
    
    return false; // Prevent default behavior
  }
}

function mouseReleased() {
  // Send note off for currently playing note
  if (currentNote !== null) {
    sendNoteOff(currentNote);
    currentNote = null;
    return false; // Prevent default behavior
  }
}

// ============================================
// MIDI Functions
// ============================================
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
  
  // Get all available MIDI outputs
  const outputs = Array.from(midiAccess.outputs.values());
  
  if (outputs.length > 0) {
    // Set the first device as default
    midiOutput = outputs[0];
    console.log('MIDI Output:', midiOutput.name);
    updateStatus(`Connected: ${midiOutput.name}`, true);
    
    // Populate the selector
    populateMIDISelector(outputs);
  } else {
    console.warn('No MIDI outputs available');
    updateStatus('No MIDI devices found', false);
  }
  
  // Log all available outputs
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
  
  // Send Note On message
  midiOutput.send([noteOnStatus, midiNumber, MIDI_VELOCITY]);
  console.log(`Note On: Channel ${MIDI_CHANNEL}, Note ${midiNumber} (${midiNumberToNoteName(midiNumber)}), Velocity ${MIDI_VELOCITY}`);
  
  // Store current note
  currentNote = midiNumber;
  
  // Create visual animation
  createNoteAnimation(midiNumberToNoteName(midiNumber), midiNumber);
}

function sendNoteOff(midiNumber) {
  if (!midiOutput) {
    console.error('No MIDI output available');
    return;
  }
  
  // Calculate MIDI status byte for Note Off
  const noteOffStatus = 0x80 | (MIDI_CHANNEL - 1);
  
  // Send Note Off message
  midiOutput.send([noteOffStatus, midiNumber, 0]);
  console.log(`Note Off: Channel ${MIDI_CHANNEL}, Note ${midiNumber} (${midiNumberToNoteName(midiNumber)})`);
}

function midiNumberToNoteName(midiNumber) {
  const octave = floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[midiNumber % 12];
  return noteName + octave;
}

// ============================================
// UI Functions
// ============================================
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
  instructionsDiv = createDiv('Click and hold anywhere to play random MIDI notes');
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

// ============================================
// Note Animation System
// ============================================
class NoteAnimation {
  constructor(noteName, x, y) {
    this.note = noteName;
    this.x = x;
    this.y = y;
    this.targetY = 0;
    this.alpha = ANIMATION_CONFIG.startAlpha;
    this.circleSize = ANIMATION_CONFIG.circleSize;
    this.speed = ANIMATION_CONFIG.speed;
    this.age = 0;
    this.maxAge = ANIMATION_CONFIG.maxAge;
  }
  
  update() {
    // Move upward
    this.y -= this.speed;
    
    // Update age and alpha
    this.age++;
    this.alpha = map(this.age, 0, this.maxAge, ANIMATION_CONFIG.startAlpha, ANIMATION_CONFIG.endAlpha);
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
    return this.age >= this.maxAge || this.y < -this.circleSize;
  }
}

function createNoteAnimation(noteName, midiNumber) {
  // Calculate X position based on MIDI note number within video area
  // Map C3 (48) to left edge of video, C4 (60) to right edge of video
  const padding = ANIMATION_CONFIG.circleSize / 2;
  let x = map(midiNumber, MIDI_NOTE_MIN, MIDI_NOTE_MAX, 
              videoOffsetX + padding, 
              videoOffsetX + videoWidth - padding);
  
  // Start at bottom of video area
  let y = videoOffsetY + videoHeight - ANIMATION_CONFIG.circleSize;
  
  // Create and add new animation
  noteAnimations.push(new NoteAnimation(noteName, x, y));
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
