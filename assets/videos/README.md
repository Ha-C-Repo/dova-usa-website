# /assets/videos/

Drop a cinematic loop here to activate the cinematic backdrop on the homepage.

## Required filenames

Either or both will work. The site tries webm first, falls back to mp4. If neither is present, the CSS fallback (animated gradient on navy) runs.

- `dova-backdrop.webm` (preferred, smaller payload)
- `dova-backdrop.mp4` (broader compatibility)

## Recommended specs

- Duration: 6 to 10 seconds, seamless loop
- Resolution: 1280 x 720 (720p)
- Frame rate: 30 fps
- Codec (webm): VP9, bitrate ~1500 kbps
- Codec (mp4): H.264, bitrate ~2500 kbps
- Audio: none (the bed is muted)

## How to generate

Google AI Studio Veo 3.1 is free with the Google Premium account already on file. Suggested prompt: "A slow cinematic close-up of a futuristic dark-navy vehicle access module with a soft cyan LED ring pulsing gently. Studio lighting, dramatic shadows, shallow depth of field. Continuous slow camera drift to the right. Seamless 8-second loop."

Export the result. If it ships above 1.5 MB, transcode via `ffmpeg` for the right size budget:

```
ffmpeg -i source.mp4 -c:v libvpx-vp9 -b:v 1500k -an -loop 1 -t 8 dova-backdrop.webm
ffmpeg -i source.mp4 -c:v libx264 -crf 24 -an -movflags +faststart -t 8 dova-backdrop.mp4
```

The site never breaks if these files are absent. The CSS fallback always runs as a baseline.