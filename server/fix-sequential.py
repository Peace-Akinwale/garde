#!/usr/bin/env python3
# Revert to sequential processing for 2GB RAM

with open('services/videoProcessor.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Make specific changes
new_lines = []
skip_until = -1

for i, line in enumerate(lines):
    # Skip lines that are part of removed blocks
    if i < skip_until:
        continue

    # Change 1: Update Step 2 comment (line 980)
    if i == 979 and 'Step 2: Extract audio AND determine' in line:
        new_lines.append('      // Step 2: Extract audio\n')
        skip_until = i + 1
        continue

    # Change 2: Remove parallel processing block (lines 983-992)
    if i == 982 and 'Step 3: Start Whisper transcription' in line:
        # Replace entire block with sequential version
        new_lines.append('      // Step 3: Transcribe audio with Whisper (sequential to save RAM on 2GB servers)\n')
        new_lines.append('      console.log(\'Transcribing audio with Whisper...\');\n')
        new_lines.append('      transcription = await transcribeAudio(audioPath);\n')
        skip_until = 993  # Skip lines 983-992
        continue

    # Change 3: Update frame extraction to happen after decision (line 1051-1060)
    if i == 1050 and 'Use pre-extracted frames' in line:
        new_lines.append('      // Extract and analyze frames if needed\n')
        skip_until = i + 1
        continue

    if i == 1051 and 'if (useVisionAPI)' in line:
        new_lines.append(line)
        continue

    if i == 1052 and 'Frames were already extracted' in line:
        new_lines.append('        // Extract frames now that we know we need them (sequential to save RAM)\n')
        new_lines.append('        console.log(`Extracting ${frameCount} frames for visual analysis...`);\n')
        new_lines.append('        const framePaths = await extractVideoFrames(videoPath, tempDir, frameCount);\n')
        new_lines.append('\n')
        new_lines.append('        console.log(`Analyzing ${frameCount} frames with Vision API...`);\n')
        skip_until = 1060  # Skip old frame extraction code (lines 1053-1059)
        continue

    # Change 4: Remove unused frame cleanup (lines 1075-1079)
    if i == 1074 and 'Pure audio transcription' in line:
        new_lines.append(line)  # Keep this comment
        skip_until = 1080  # Skip cleanup code
        continue

    # Keep all other lines
    new_lines.append(line)

# Write back
with open('services/videoProcessor.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("SUCCESS: Reverted to sequential processing")
print("- Whisper runs first")
print("- Frames extracted only when needed")
print("- RAM-friendly for 2GB servers")
