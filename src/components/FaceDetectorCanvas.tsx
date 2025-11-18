'use client';

import { useRef, useEffect } from 'react';
import { FaceBox, FaceLandmarks } from '../lib/mediapipeClient';

export interface FaceDetectorCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  boxes: FaceBox[];
  landmarks: FaceLandmarks[];
  mirror?: boolean;
  showBoxes?: boolean;
  showLandmarks?: boolean;
  boxColor?: string;
  landmarkColor?: string;
  className?: string;
}

/**
 * FaceDetectorCanvas Component
 * Draws face detection boxes and landmarks on a canvas overlay
 */
export default function FaceDetectorCanvas({
  videoRef,
  boxes,
  landmarks,
  mirror = true,
  showBoxes = true,
  showLandmarks = true,
  boxColor = '#10b981', // green
  landmarkColor = '#06b6d4', // cyan
  className = '',
}: FaceDetectorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Draw detection results on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply mirroring if needed
    if (mirror) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
    }

    // Draw bounding boxes
    if (showBoxes && boxes.length > 0) {
      boxes.forEach((box) => {
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(box.x, box.y, box.width, box.height, 12);
        ctx.stroke();

        // Draw confidence score
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 16px sans-serif';
        const scoreText = `${(box.score * 100).toFixed(0)}%`;
        const textMetrics = ctx.measureText(scoreText);
        const textX = box.x;
        const textY = box.y - 8;
        
        // Background for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(textX - 4, textY - 18, textMetrics.width + 8, 24);
        
        // Text
        ctx.fillStyle = boxColor;
        ctx.fillText(scoreText, textX, textY);
      });
    }

    // Draw landmarks (468 points)
    if (showLandmarks && landmarks.length > 0) {
      landmarks.forEach((faceLandmarks) => {
        faceLandmarks.points.forEach((point, idx) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;

          // Draw landmark point
          ctx.fillStyle = landmarkColor;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw outline for better visibility
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });

        // Draw face mesh connections (optional - for key features)
        drawFaceMeshConnections(ctx, faceLandmarks, canvas.width, canvas.height, landmarkColor);
      });
    }

    // Restore context if mirrored
    if (mirror) {
      ctx.restore();
    }
  }, [videoRef, boxes, landmarks, mirror, showBoxes, showLandmarks, boxColor, landmarkColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{
        transform: mirror ? 'scaleX(-1)' : 'none',
      }}
    />
  );
}

/**
 * Draw key face mesh connections for better visualization
 */
function drawFaceMeshConnections(
  ctx: CanvasRenderingContext2D,
  faceLandmarks: FaceLandmarks,
  width: number,
  height: number,
  color: string
) {
  // Face oval
  const faceOval = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
  ];

  // Left eye
  const leftEye = [
    33, 7, 163, 144, 145, 153, 154, 155, 133,
    173, 157, 158, 159, 160, 161, 246, 33
  ];

  // Right eye
  const rightEye = [
    362, 382, 381, 380, 374, 373, 390, 249,
    263, 466, 388, 387, 386, 385, 384, 398, 362
  ];

  // Lips outer
  const lipsOuter = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
    291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 61
  ];

  // Nose
  const nose = [168, 6, 197, 195, 5];

  // Left eyebrow
  const leftEyebrow = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107];

  // Right eyebrow
  const rightEyebrow = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336];

  const connections = [
    faceOval,
    leftEye,
    rightEye,
    lipsOuter,
    nose,
    leftEyebrow,
    rightEyebrow,
  ];

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;

  connections.forEach((connection) => {
    ctx.beginPath();
    connection.forEach((idx, i) => {
      if (idx < faceLandmarks.points.length) {
        const point = faceLandmarks.points[idx];
        const x = point.x * width;
        const y = point.y * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();
  });

  ctx.globalAlpha = 1.0;
}

