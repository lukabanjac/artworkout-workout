import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import io from 'socket.io-client';
import { nanoid } from 'nanoid';

const socket = io('http://localhost:3000'); // your backend WS

export default function DualCanvas() {
  const [localLines, setLocalLines] = useState<any[]>([]);
  const [remoteLines, setRemoteLines] = useState<any[]>([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const isDrawing = useRef(false);

  // --- handle local drawing ---
  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLocalLines([
      ...localLines,
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
    let lastLine = localLines[localLines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLocalLines(localLines.slice(0, -1).concat(lastLine));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    const payload = {
      drawing_id: 'd_456',
      strokes: localLines.slice(-1), // send only the last stroke
      version: 3,
      updated_at: new Date().toISOString(),
    };

    console.log('sending drawing:', payload);
    socket.emit('drawing:update', payload);
  };

  // --- subscribe to backend drawing updates ---
  useEffect(() => {
    socket.on('drawing:broadcast', (data) => {
      console.log('📩 Received from backend:', data);
      if (data?.strokes?.length) {
        setRemoteLines((prev) => [...prev, ...data.strokes]);
      }
    });

    return () => {
      socket.off('drawing:broadcast');
    };
  }, []);

  // --- canvas dimensions ---
  const canvasWidth = window.innerWidth / 2 - 20;
  const canvasHeight = window.innerHeight - 60;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
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

      {/* Canvases side by side */}
      <div className="flex flex-col justify-center gap-4 p-2">
        <span> Local drawing canvas </span>

        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className="bg-white border border-black"
        >
          <Layer>
            {localLines.map((line, i) => (
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

        <span> Remote canvas </span>
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          className="bg-white border border-black"
        >
          <Layer>
            {remoteLines.map((line, i) => (
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
