# P5js MIDI Web Application - Development Plan (v2)

## Project Overview
Build a P5js-based web application that connects to a MIDI device, sends random MIDI notes with mouse interaction, and displays visual feedback overlaid on a fullscreen webcam feed.

## Requirements Summary
- Connect to MIDI devices using Web MIDI API
- Send random MIDI note (C3 to C4) on channel 1 when mouse is pressed in canvas
- Note duration determined by how long mouse is held down
- Display fullscreen webcam video
- Show animated note indicators when notes are played
- Visual feedback: white circles with note names that float upward with increasing transparency

## Key Changes from Previous Version
- **Random Notes**: Instead of fixed C3, send random notes from C3 (48) to C4 (60)
- **Mouse Interaction**: Replace button with mouse press/release events
- **Dynamic Duration**: Note duration matches mouse press length (no fixed 500ms)
- **Note Mapping**: Need to convert MIDI numbers to note names (C3, C#3, D3, etc.)

## Technical Stack
- **Frontend**: P5js, HTML, CSS, JavaScript
- **APIs**: Web MIDI API, getUserMedia API (for webcam)
- **Libraries**: P5js (core library)

## Architecture & Components

### 1. HTML Structure (`index.html`)
- Basic HTML5 boilerplate
- Include P5js library from CDN
- Container div for P5js canvas
- Link to external CSS and JavaScript files

### 2. Styling (`style.css`)
- Remove default margins/padding
- Ensure canvas fills viewport
- Cursor style change on canvas (pointer to indicate interactivity)
- Responsive design considerations

### 3. Main Application (`sketch.js`)

#### 3.1 Global Variables
```javascript
- midiAccess: MIDI access object
- midiOutput: Selected MIDI output device
- capture: Webcam video capture
- noteAnimations: Array to track active note animations
- currentNote: Currently playing note (null if none)
- mouseIsPressed: Track mouse state
- statusDiv: Status indicator element
```

#### 3.2 MIDI Configuration
```javascript
const MIDI_NOTE_MIN = 48;  // C3
const MIDI_NOTE_MAX = 60;  // C4
const MIDI_CHANNEL = 1;
const MIDI_VELOCITY = 100;

// Note name mapping
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
```

#### 3.3 MIDI Setup
**Function: `initMIDI()`**
- Request MIDI access using `navigator.requestMIDIAccess()`
- Handle success/failure callbacks
- Enumerate available MIDI outputs
- Store reference to first available MIDI output
- Display connection status to user

**Function: `midiNumberToNoteName(midiNumber)`**
- Convert MIDI note number to note name with octave
- Example: 48 → "C3", 49 → "C#3", 60 → "C4"
- Formula: `NOTE_NAMES[midiNumber % 12] + Math.floor(midiNumber / 12 - 1)`

**Function: `sendNoteOn(midiNumber)`**
- Send MIDI Note On message
- Store current note being played
- Create visual animation
- Syntax: `[0x90 | (channel-1), midiNumber, velocity]`

**Function: `sendNoteOff(midiNumber)`**
- Send MIDI Note Off message
- Clear current note reference
- Syntax: `[0x80 | (channel-1), midiNumber, 0]`

#### 3.4 Webcam Setup
**Function: `setup()`**
- Create canvas matching window dimensions
- Initialize webcam capture using `createCapture(VIDEO)`
- Hide default video element (we'll draw it on canvas)
- Set canvas to cover entire window
- Initialize MIDI
- Create status indicator

**Function: `windowResized()`**
- Resize canvas when window dimensions change
- Update webcam capture size

#### 3.5 Mouse Event Handlers
**Function: `mousePressed()`**
- Check if mouse is within canvas bounds
- Generate random MIDI note number between MIDI_NOTE_MIN and MIDI_NOTE_MAX
- Send Note On message
- Store reference to current note
- Return false to prevent default behavior

**Function: `mouseReleased()`**
- Check if a note is currently playing
- Send Note Off message for current note
- Clear current note reference
- Return false to prevent default behavior

**Alternative: Use P5js `draw()` loop**
- Check `mouseIsPressed` boolean in draw loop
- Track previous mouse state to detect press/release
- More responsive than event handlers

#### 3.6 Note Animation System
**Class: `NoteAnimation`**

Properties:
- `note`: Note name (e.g., "C3", "D#3")
- `x`: X position (random within canvas width)
- `y`: Starting Y position (canvas height)
- `targetY`: Ending Y position (0)
- `alpha`: Current transparency (255 to 0)
- `circleSize`: Diameter of circle (e.g., 60px)
- `speed`: Upward movement speed
- `age`: Time alive (for calculating alpha)
- `maxAge`: Lifespan before removal

Methods:
- `update()`: Move upward, decrease alpha based on age
- `display()`: Draw white circle with note text
- `isDead()`: Check if animation should be removed

**Function: `createNoteAnimation(noteName)`**
- Create new NoteAnimation instance
- Randomize X position
- Set Y to bottom of screen
- Add to noteAnimations array

**Function: `updateNoteAnimations()`**
- Loop through noteAnimations array
- Call update() and display() on each
- Remove dead animations

#### 3.7 Main Draw Loop
**Function: `draw()`**
- Draw webcam capture fullscreen: `image(capture, 0, 0, width, height)`
- Update and display all note animations
- Handle mouse-based MIDI triggering (if using draw-based approach)
- Optionally display MIDI status indicator

#### 3.8 Status Display
**Function: `createStatusIndicator()`**
- Create div element for status display
- Position in corner of screen
- Show MIDI connection status

**Function: `updateStatus(message, isConnected)`**
- Update status text and styling
- Visual indicator of connection state

## Implementation Phases

### Phase 1: Basic Setup
**Files to create/modify:**
- `index.html` - Update HTML structure
- `style.css` - Update styling
- `sketch.js` - Update P5js sketch structure

**Tasks:**
1. Set up HTML boilerplate
2. Include P5js library (CDN)
3. Create basic P5js sketch structure
4. Test that P5js loads correctly

### Phase 2: Webcam Integration
**Tasks:**
1. Implement webcam capture in `setup()`
2. Draw video feed in `draw()` at fullscreen
3. Handle permissions and errors
4. Test responsive resizing

### Phase 3: MIDI Connection
**Tasks:**
1. Implement `initMIDI()` function
2. Request MIDI access
3. Handle MIDI device enumeration
4. Store MIDI output reference
5. Display connection status
6. Add error handling for browsers without MIDI support

### Phase 4: Mouse Interaction & Random Notes
**Tasks:**
1. Implement `mousePressed()` event handler
2. Implement `mouseReleased()` event handler
3. Generate random MIDI note in range (48-60)
4. Implement `midiNumberToNoteName()` converter
5. Implement `sendNoteOn()` function
6. Implement `sendNoteOff()` function
7. Track currently playing note
8. Test mouse press/release triggering notes

### Phase 5: Note Animation System
**Tasks:**
1. Create NoteAnimation class structure
2. Implement update() logic (movement + alpha fade)
3. Implement display() logic (circle + text)
4. Add animation when note is triggered
5. Clean up dead animations
6. Fine-tune animation parameters (speed, size, lifespan)
7. Test with multiple simultaneous notes

### Phase 6: Polish & Testing
**Tasks:**
1. Refine UI/UX (cursor styles, visual feedback)
2. Add visual indicator when mouse is pressed
3. Test with multiple MIDI devices
4. Test animation performance
5. Add keyboard shortcuts (optional: spacebar for random note)
6. Cross-browser testing (Chrome, Edge)
7. Add user instructions/help text
8. Performance optimization

## File Structure
```
web-midi/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── sketch.js           # Main P5js sketch
├── AGENTS.MD           # Development rules
├── PLAN.MD             # This file
└── README.md           # Project documentation
```

## MIDI Technical Details

### MIDI Note Numbers
- C3 = MIDI note number 48
- C4 = MIDI note number 60
- Range: 48-60 (13 notes, one octave + one note)
- Includes: C3, C#3, D3, D#3, E3, F3, F#3, G3, G#3, A3, A#3, B3, C4

### MIDI Messages Format
**Note On:**
- Byte 1: `0x90 | (channel - 1)` (for channel 1: 0x90)
- Byte 2: Note number (0-127)
- Byte 3: Velocity (0-127, 0 = note off)

**Note Off:**
- Byte 1: `0x80 | (channel - 1)` (for channel 1: 0x80)
- Byte 2: Note number (0-127)
- Byte 3: Velocity (typically 0)

### Note Name Conversion
```javascript
function midiNumberToNoteName(midiNumber) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = noteNames[midiNumber % 12];
  return noteName + octave;
}
```

## Animation Parameters (Suggested)

```javascript
const ANIMATION_CONFIG = {
  circleSize: 60,           // Circle diameter in pixels
  circleColor: 255,         // White
  textSize: 16,             // Font size for note name
  speed: 2,                 // Pixels per frame upward movement
  maxAge: 180,              // Frames before disappearing (~3 seconds at 60fps)
  startAlpha: 255,          // Fully opaque
  endAlpha: 0,              // Fully transparent
  randomXRange: true        // Randomize horizontal position
};
```

## Mouse Interaction Logic

### Approach 1: Event Handlers (Recommended)
```javascript
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    const note = floor(random(MIDI_NOTE_MIN, MIDI_NOTE_MAX + 1));
    sendNoteOn(note);
    return false; // Prevent default
  }
}

function mouseReleased() {
  if (currentNote !== null) {
    sendNoteOff(currentNote);
    currentNote = null;
  }
  return false;
}
```

### Approach 2: Draw Loop
```javascript
let prevMousePressed = false;

function draw() {
  // ... render code ...
  
  if (mouseIsPressed && !prevMousePressed) {
    // Mouse just pressed
    const note = floor(random(MIDI_NOTE_MIN, MIDI_NOTE_MAX + 1));
    sendNoteOn(note);
  } else if (!mouseIsPressed && prevMousePressed) {
    // Mouse just released
    if (currentNote !== null) {
      sendNoteOff(currentNote);
    }
  }
  
  prevMousePressed = mouseIsPressed;
}
```

## Browser Compatibility Notes
- **Web MIDI API**: Chrome, Edge, Opera (not Safari, Firefox by default)
- **getUserMedia**: All modern browsers
- Require HTTPS for webcam access (except localhost)
- User must grant MIDI and camera permissions

## Security Considerations
- Request permissions appropriately
- Provide clear user feedback for permission requests
- Handle denial gracefully
- Use HTTPS in production

## Testing Checklist
- [ ] MIDI device connects successfully
- [ ] Random note (48-60) generated on mouse press
- [ ] Note plays for duration of mouse press
- [ ] Note stops when mouse is released
- [ ] Webcam displays fullscreen
- [ ] Note animation appears at mouse press location (or random)
- [ ] Animation floats upward smoothly
- [ ] Animation fades out properly
- [ ] Multiple animations can exist simultaneously
- [ ] Dead animations are cleaned up
- [ ] Window resizing works correctly
- [ ] Works on different screen sizes
- [ ] Graceful fallback when MIDI not supported
- [ ] Graceful fallback when webcam not available
- [ ] Mouse press outside canvas doesn't trigger notes
- [ ] Note name displays correctly for all notes in range

## Future Enhancements (Optional)
- MIDI input listening (display notes from keyboard)
- Mouse position affects velocity (Y-axis)
- Mouse position affects note pitch (X-axis = pitch)
- Visual feedback on mouse press (ripple effect)
- Different animation colors per note
- Sustain pedal support
- Multiple octave ranges
- Recording/playback functionality
- Visual piano keyboard overlay
- Sound synthesis if no MIDI device available
- Touch screen support

## Resources & References
- [Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [P5js Reference](https://p5js.org/reference/)
- [P5js Mouse Functions](https://p5js.org/reference/#group-Events)
- [P5js Video Capture](https://p5js.org/reference/#/p5/createCapture)
- [MIDI Note Numbers Chart](https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies)

## Development Timeline Estimate
- Phase 1: 15 minutes (minor updates)
- Phase 2: 15 minutes (already implemented)
- Phase 3: 15 minutes (already implemented)
- Phase 4: 1 hour (new mouse interaction + random notes)
- Phase 5: 30 minutes (minor updates to existing system)
- Phase 6: 45 minutes
- **Total: ~3 hours**

## Success Criteria
✅ Application connects to MIDI device
✅ Mouse press triggers random note in C3-C4 range
✅ Note plays while mouse is held down
✅ Note stops when mouse is released
✅ Webcam displays fullscreen
✅ Note animations appear and animate correctly
✅ Correct note name displayed in animation
✅ Clean, responsive user interface
✅ Proper error handling
✅ Cross-browser compatible (MIDI-supporting browsers)

## Migration Notes from Previous Version
- Remove button UI element
- Remove button event handler
- Add mouse event handlers
- Implement random note generation
- Implement MIDI number to note name conversion
- Update Note On/Off to track and release specific notes
- Update documentation and user instructions
