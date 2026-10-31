import os
import glob
import json
import cv2
import numpy as np

def compile_video():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frames_dir = os.path.join(base_dir, "temp_video_frames")
    output_video = os.path.join(base_dir, "OmniClass_Demo_Walkthrough.mp4")

    frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))
    print(f"Found {len(frame_files)} frames in {frames_dir}")

    if not frame_files:
        print("Error: No frames found!")
        return

    first_frame = cv2.imread(frame_files[0])
    height, width, _ = first_frame.shape
    fps = 15.0

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video, fourcc, fps, (width, height))

    def make_title_card(title, subtitle, duration_frames=30):
        card = np.zeros((height, width, 3), dtype=np.uint8)
        card[:] = (25, 18, 15) # deep slate navy

        # Subtle gradient line
        cv2.line(card, (80, height // 2 - 40), (width - 80, height // 2 - 40), (235, 100, 37), 3)

        cv2.putText(card, "OMNICLASS LEARNING MANAGEMENT SYSTEM", (80, height // 2 - 60),
                    cv2.FONT_HERSHEY_DUPLEX, 0.75, (200, 160, 100), 1, cv2.LINE_AA)

        cv2.putText(card, title, (80, height // 2 + 10),
                    cv2.FONT_HERSHEY_DUPLEX, 1.3, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(card, subtitle, (80, height // 2 + 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.85, (200, 200, 200), 1, cv2.LINE_AA)

        for _ in range(duration_frames):
            out.write(card)

    print("Writing Intro Card...")
    make_title_card("Platform Feature Walkthrough", "Live Browser Recording of Student, Instructor & AI Capabilities", 35)

    print("Processing and compiling frames with lower-third overlays...")
    for idx, fpath in enumerate(frame_files):
        frame = cv2.imread(fpath)
        json_path = fpath.replace(".jpg", ".json")
        label = "OmniClass LMS Feature Tour"
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                label = data.get("label", label)

        # Draw sleek lower-third capsule overlay
        overlay = frame.copy()
        box_y1 = height - 56
        box_y2 = height - 16
        box_x1 = 30
        box_x2 = width - 30

        # Translucent dark pill
        cv2.rectangle(overlay, (box_x1, box_y1), (box_x2, box_y2), (15, 23, 42), -1)
        cv2.addWeighted(overlay, 0.82, frame, 0.18, 0, frame)

        # Border
        cv2.rectangle(frame, (box_x1, box_y1), (box_x2, box_y2), (59, 130, 246), 1)

        # Badge pill
        cv2.rectangle(frame, (box_x1 + 10, box_y1 + 8), (box_x1 + 145, box_y2 - 8), (37, 99, 235), -1)
        cv2.putText(frame, "OMNICLASS DEMO", (box_x1 + 16, box_y1 + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        # Caption text
        cv2.putText(frame, label, (box_x1 + 160, box_y1 + 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (241, 245, 249), 1, cv2.LINE_AA)

        out.write(frame)

    print("Writing Outro Card...")
    make_title_card("OmniClass LMS &bull; Verification Complete", "Full Stack Capstone &bull; MERN + Applied AI &bull; GitHub: Shaik673/OmniClass", 35)

    out.release()
    print(f"Video compiled successfully: {output_video}")

    if os.path.exists(output_video):
        size_mb = os.path.getsize(output_video) / (1024 * 1024)
        print(f"Video Size: {size_mb:.2f} MB")

if __name__ == "__main__":
    compile_video()

