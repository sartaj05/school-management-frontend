# Smart Classroom website contract

The React classroom screen consumes `/api/v1/smart-classroom/capabilities`.
It must show each gate separately and keep playback disabled until the backend
marks a recording `ready`. Production HLS/WebRTC status comes from the backend;
the website must not infer readiness from a local browser recording.
