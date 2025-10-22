import { useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useDrawingSocket } from './hooks/useDrawingSocket';

export default function App() {
  const [lines, setLines] = useState<{ points: number[] }[]>([]);
  const isDrawing = useRef(false);

  const { sendPoints } = useDrawingSocket((data) => {
    // When receiving updates from backend, add new lines
    setLines((prev) => [...prev, data]);
  });

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    const lastLine = lines[lines.length - 1];
    sendPoints(lastLine.points); // 👈 send over socket
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      className="bg-white cursor-crosshair"
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke="#000"
            strokeWidth={2}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </Layer>
    </Stage>
  );
}
