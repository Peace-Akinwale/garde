import re

# Read the file
with open('services/videoProcessor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Change parallel processing to sequential
old_parallel = '''      // Step 2: Extract audio AND determine if we'll need frames (parallel preparation)
      await extractAudio(videoPath, audioPath);

      // Step 3: Start Whisper transcription (don't wait - run in parallel with frame extraction)
      const whisperPromise = transcribeAudio(audioPath);

      // Step 3.5: Start frame extraction early (we'll likely need it)
      // Extract frames while Whisper is running to save time
      console.log('⚡ Starting parallel processing: Whisper + Frame extraction...');
      const framesPromise = extractVideoFrames(videoPath, tempDir, 12); // Extract max frames early

      // Wait for Whisper to finish (need it to decide frame strategy)
      transcription = await whisperPromise;'''

new_sequential = '''      // Step 2: Extract audio
      await extractAudio(videoPath, audioPath);

      // Step 3: Transcribe audio with Whisper (sequential to save RAM on 2GB servers)
      console.log('Transcribing audio with Whisper...');
      transcription = await transcribeAudio(audioPath);'''

content = content.replace(old_parallel, new_sequential)

# Pattern 2: Change frame extraction to happen AFTER decision (not before)
old_frame_usage = '''      // Use pre-extracted frames and analyze if needed
      if (useVisionAPI) {
        // Frames were already extracted in parallel with Whisper
        const allFramePaths = await framesPromise;

        // Use only the frames we need based on content type
        const framePaths = allFramePaths.slice(0, frameCount);

        console.log(`⚡ Frames ready! Analyzing ${frameCount} frames with Vision API...`);
        const visionAnalysis = await analyzeImagesWithVision(framePaths, false);'''

new_frame_usage = '''      // Extract and analyze frames if needed
      if (useVisionAPI) {
        // Extract frames now that we know we need them (sequential to save RAM)
        console.log(`Extracting ${frameCount} frames for visual analysis...`);
        const framePaths = await extractVideoFrames(videoPath, tempDir, frameCount);

        console.log(`Analyzing ${frameCount} frames with Vision API...`);
        const visionAnalysis = await analyzeImagesWithVision(framePaths, false);'''

content = content.replace(old_frame_usage, new_frame_usage)

# Pattern 3: Remove the unused frames cleanup code (no longer needed)
old_cleanup = '''      } else {
        // Pure audio transcription (rare - only if perfect narration with no visual text)
        // Clean up pre-extracted frames since we don't need them
        framesPromise.then(frames => {
          frames.forEach(f => fs.unlink(f, () => {}));
        }).catch(() => {});

        contentType = 'video';'''

new_cleanup = '''      } else {
        // Pure audio transcription (rare - only if perfect narration with no visual text)
        contentType = 'video';'''

content = content.replace(old_cleanup, new_cleanup)

# Write back
with open('services/videoProcessor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully reverted to sequential processing for 2GB RAM compatibility")
