import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import io from 'socket.io-client';
import { nanoid } from 'nanoid';

const socket = io('http://localhost:3000'); // your Nest backend ws

export default function DrawingBoard() {
  const [lines, setLines] = useState<any[]>([]);
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const isDrawing = useRef(false);

  // Handle drawing
  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([
      ...lines,
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
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines(lines.slice(0, -1).concat(lastLine));
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    const payload = {
      drawing_id: 'd_456',
      strokes: lines,
      version: 3,
      updated_at: new Date().toISOString(),
    };

    console.log('sending drawing:', payload);
    socket.emit('drawing:update', payload);
  };

  return (
    <div className="w-full h-screen flex flex-col items-center bg-gray-100">
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

      {/* Canvas */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 60}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        className="bg-white"
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.width}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
