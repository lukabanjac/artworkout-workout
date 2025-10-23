import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import io from 'socket.io-client';
import { nanoid } from 'nanoid';

const socket = io('http://localhost:3000');

export default function DualCanvas() {
  const [lines, setLines] = useState<any[]>([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const isDrawing = useRef(false);

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines((prev) => [
      ...prev,
      {
        id: nanoid(),
        tool: 'pencil',
        color,
        width: strokeWidth,
        points: [pos.x, pos.y],
      },
    ]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      const updated = prevLines.slice(0, -1).concat(lastLine);
      return updated;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    // Send only the last line drawn
    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;

    const payload = {
      drawing_id: 'd_456',
      strokes: [lastLine],
      version: 3,
      updated_at: new Date().toISOString(),
    };

    console.log('🖊️ sending drawing:', payload);
    socket.emit('drawing:update', payload);
  };

  // Listen for incoming lines from backend
  useEffect(() => {
    socket.on('drawing:broadcast', (data) => {
      if (data?.strokes?.length) {
        console.log('📩 received from backend:', data);
        setLines((prev) => [...prev, ...data.strokes]);
      }
    });

    return () => {
      socket.off('drawing:broadcast');
    };
  }, []);

  const canvasWidth = window.innerWidth - 40;
  const canvasHeight = window.innerHeight - 100;

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
      {/* Palette */}
      <div className="flex items-center gap-3 p-3 bg-white shadow-md w-full justify-center">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
        />
        <span>{strokeWidth}px</span>
      </div>

      {/* Shared Canvas */}
      <div className="flex flex-col items-center p-4">
        <span className="mb-2 font-semibold text-gray-700">
          Shared Drawing Canvas (syncs with all connected clients)
        </span>
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className="bg-white border-2 border-black rounded"
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={line.id || i}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.width}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
