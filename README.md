# P5js MIDI Web Application - Mouse Control

A web application that connects to MIDI devices and sends random MIDI notes with mouse-based interaction, featuring visual feedback overlaid on a webcam feed.

## Features

- **MIDI Integration**: Connects to MIDI devices using the Web MIDI API
- **Mouse Control**: Click and hold anywhere in the canvas to play notes
- **Random Notes**: Sends random notes from C3 to C4 (MIDI 48-60)
- **Dynamic Duration**: Note plays as long as mouse is held down
- **Webcam Display**: Fullscreen webcam video background
- **Visual Feedback**: Animated white circles with note names that float upward and fade out

## Requirements

- Modern web browser with Web MIDI API support (Chrome, Edge, Opera)
- MIDI device or virtual MIDI software
- Webcam access
- HTTPS connection (required for webcam access, except on localhost)

## Quick Start

1. Open `index.html` in a supported browser
2. Grant webcam and MIDI permissions when prompted
3. Click and hold anywhere in the canvas to play random MIDI notes
4. Release to stop the note
5. Watch the animated note indicators float upward on the webcam feed

## How to Use

- **Click and Hold**: Press and hold the mouse button anywhere in the canvas
- **Random Note**: Each click generates a random note between C3 and C4
- **Duration**: The note plays for as long as you hold the mouse button
- **Release**: Let go of the mouse button to stop the note

## File Structure

```
web-midi/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── sketch.js           # Main P5js sketch
├── AGENTS.MD           # Development rules
├── PLAN.MD             # Development plan
└── README.md           # This file
```

## Technical Details

### MIDI Configuration

- **Note Range**: C3 (MIDI 48) to C4 (MIDI 60)
- **Total Notes**: 13 chromatic notes
- **Channel**: 1
- **Velocity**: 100
- **Duration**: Variable (controlled by mouse press duration)

### Note Range (C3 to C4)

C3, C#3, D3, D#3, E3, F3, F#3, G3, G#3, A3, A#3, B3, C4

### Animation Configuration

- **Circle Size**: 60px
- **Speed**: 2 pixels per frame
- **Lifespan**: 180 frames (~3 seconds at 60fps)
- **Color**: White with fade-out effect
- **Position**: Random horizontal position at bottom of screen

## Browser Compatibility

| Browser | Web MIDI API | getUserMedia |
|---------|--------------|--------------|
| Chrome  | ✅           | ✅           |
| Edge    | ✅           | ✅           |
| Opera   | ✅           | ✅           |
| Firefox | ❌ (by default) | ✅       |
| Safari  | ❌           | ✅           |

**Note**: Firefox and Safari do not support the Web MIDI API by default.

## Troubleshooting

### No MIDI Devices Found

- Ensure a MIDI device is connected
- Use virtual MIDI software (e.g., loopMIDI, IAC Driver)
- Check browser console for error messages

### Webcam Not Working

- Grant camera permissions in browser
- Ensure no other application is using the webcam
- Use HTTPS or localhost

### Notes Not Playing

- Wait for MIDI connection to establish
- Check that a MIDI output device is available
- Verify browser supports Web MIDI API
- Check browser console for errors

### Mouse Not Responding

- Ensure mouse clicks are within the canvas area
- Check browser console for JavaScript errors
- Verify permissions for MIDI access have been granted

## Implementation Details

### Random Note Generation

```javascript
const note = floor(random(MIDI_NOTE_MIN, MIDI_NOTE_MAX + 1));
```

Generates a random integer between 48 and 60 (inclusive).

### MIDI Number to Note Name Conversion

```javascript
function midiNumberToNoteName(midiNumber) {
  const octave = floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[midiNumber % 12];
  return noteName + octave;
}
```

Converts MIDI numbers to human-readable note names with octave.

### Mouse Event Flow

1. **Mouse Pressed** → Generate random note → Send Note On → Create animation
2. **Mouse Held** → Note continues playing
3. **Mouse Released** → Send Note Off → Clear current note

## Development

Built with:

- **P5js**: Creative coding library for canvas and interaction
- **Web MIDI API**: MIDI device communication
- **getUserMedia API**: Webcam access

## Future Enhancements

- Mouse Y position affects velocity (pressure-sensitive)
- Mouse X position affects note pitch (continuous control)
- Visual ripple effect on mouse press
- Different animation colors per note
- Touch screen support
- MIDI input monitoring
- Recording and playback

## License

MIT
