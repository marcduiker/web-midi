# P5js MIDI Web Application - Development Plan (v3)

## Project Overview

Build a comprehensive P5js-based web application that:
- Connects to MIDI devices with device selection
- Triggers notes via mouse interaction and Server-Sent Events (SSE)
- Displays visual feedback overlaid on a 16:9 webcam feed
- Visualizes microphone input as a real-time waveform
- Provides multi-camera support

## Requirements Summary

- Connect to MIDI devices using Web MIDI API with dropdown selector
- Select webcam source with dropdown selector (supports multiple cameras)
- Send random MIDI note (C3 to C4) on channel 1 when mouse is pressed below UI area
- Note duration determined by how long mouse is held down
- Receive note events via Server-Sent Events (SSE) from localhost:5500
- Display 16:9 aspect ratio webcam video, centered on screen with letterboxing
- Show animated note indicators positioned horizontally by pitch (C3 left, C4 right)
- Visual feedback: white circles with note names that float upward
- Circles maintain full opacity while note is active
- Circles fade only after note is released (mouse up or SSE duration ends)
- Display microphone waveform overlay using FFT analysis (256 samples)
- Waveform drawn with white stroke across full screen width

## Evolution of Requirements

**v1**: Button-triggered single note (C3) with fullscreen webcam

**v2**: Mouse-triggered random notes with dynamic duration

**v3** (Current): 
- Added MIDI output device selector (top-left)
- Added webcam device selector (positioned to right of MIDI selector)
- Added Server-Sent Events (SSE) support for external note triggering
- Changed to 16:9 centered webcam display
- Note circles positioned by pitch across screen width
- Circles only fade after note release (not during playback)
- Added microphone input visualization with FFT waveform
- UI elements excluded from mouse interaction area (top 100px)

## Technical Stack

- **Frontend**: P5js, HTML, CSS, JavaScript
- **APIs**: 
  - Web MIDI API (MIDI device communication)
  - MediaDevices API (camera enumeration and selection)
  - getUserMedia API (webcam and microphone access)
  - EventSource API (Server-Sent Events)
- **Libraries**: 
  - P5js 1.7.0 (core library)
  - P5.sound (audio input and FFT analysis)

## File Structure

```
web-midi/
├── index.html          # Main HTML with P5.js includes
├── style.css           # Styling for UI elements
├── sketch.js           # Main P5.js application (~550 lines)
├── AGENTS.MD           # Development rules
├── PLAN.MD             # This file
└── README.md           # Project documentation
```

## Key Features Implemented

### 1. MIDI Device Management
- Web MIDI API integration
- Dynamic device enumeration
- Dropdown selector at (20, 60)
- Real-time device switching
- Status indicator showing connection state

### 2. Multi-Camera Support
- MediaDevices API for camera enumeration
- Dropdown selector at (240, 60)
- 16:9 aspect ratio constraint
- Dynamic camera switching without page reload

### 3. Mouse-Based Note Triggering
- Click and hold in canvas (below Y=100)
- Random note generation (C3-C4)
- Note On when pressed, Note Off when released
- Visual feedback with positioned animations

### 4. Server-Sent Events (SSE)
- EventSource connection to localhost:5500/events
- JSON payload parsing with note and duration
- Automated Note On/Off timing
- Integration with animation system

### 5. Visual Note Animations
- Pitch-based horizontal positioning
- Vertical floating motion
- Active/inactive state tracking
- Fade-on-release behavior
- Proper lifecycle management

### 6. 16:9 Video Display
- Dynamic dimension calculation
- Centered display with letterboxing
- Responsive to window resizing
- Native 16:9 camera mode

### 7. Audio Waveform Visualization
- Microphone input capture
- FFT analysis with 256 bins
- Real-time waveform rendering
- White stroke overlay on video

## MIDI Technical Details

### Note Range
- C3 = MIDI 48 (leftmost position)
- C4 = MIDI 60 (rightmost position)
- Total: 13 chromatic notes

### MIDI Messages
**Note On**: `[0x90 | (channel-1), note, velocity]`
- Channel 1: 0x90
- Velocity: 100

**Note Off**: `[0x80 | (channel-1), note, 0]`
- Channel 1: 0x80

### SSE Payload Format
```json
{
  "message": "hello",
  "note": "C3",
  "duration": 200
}
```

## Browser Compatibility

| Feature | Chrome | Edge | Opera | Firefox | Safari |
|---------|--------|------|-------|---------|--------|
| Web MIDI API | ✅ | ✅ | ✅ | ❌ | ❌ |
| getUserMedia | ✅ | ✅ | ✅ | ✅ | ✅ |
| MediaDevices | ✅ | ✅ | ✅ | ✅ | ✅ |
| EventSource (SSE) | ✅ | ✅ | ✅ | ✅ | ✅ |
| P5.sound | ✅ | ✅ | ✅ | ✅ | ✅ |

**Note**: MIDI functionality requires Chromium-based browsers.

## Testing Checklist

- [x] MIDI device connects and appears in selector
- [x] Can switch between multiple MIDI devices
- [x] Random notes (48-60) generated on mouse press
- [x] Notes play for duration of mouse press
- [x] Notes stop when mouse released
- [x] Webcam displays in 16:9 centered
- [x] Can switch between multiple webcams
- [x] Note animations positioned by pitch
- [x] Animations stay opaque while active
- [x] Animations fade after release
- [x] SSE connection establishes
- [x] SSE events trigger notes correctly
- [x] Microphone waveform displays
- [x] UI elements remain clickable

## Future Enhancements

- MIDI input monitoring
- Velocity control via mouse Y position
- Recording and playback
- Customizable note ranges
- Color-coded notes
- Settings panel
- Touch screen support
- Preset save/load

## Success Criteria

✅ Selectable MIDI device output  
✅ Selectable webcam input  
✅ Mouse-triggered random notes  
✅ SSE-triggered timed notes  
✅ 16:9 centered webcam display  
✅ Pitch-based note positioning  
✅ Release-based animation fading  
✅ Real-time waveform visualization  
✅ Clean responsive UI  
✅ Proper error handling
