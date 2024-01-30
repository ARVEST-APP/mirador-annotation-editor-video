import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Transformer, Line, Group } from 'react-konva';

/** FreeHand shape displaying */
function Freehand({
  activeTool,  onShapeClick,  isSelected, shape, onTransform, handleDragEnd,
}) {
  // TODO check if selectedShapeId is needed
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, shape]);

  /** */
  const handleClick = () => {
    onShapeClick(shape);
  };

  return (
    <>
      <Group
        ref={shapeRef}
        onClick={handleClick}
        onTransform={onTransform}
        scaleX={shape.scaleX}
        scaleY={shape.scaleY}
        rotation={shape.rotation}
        x={shape.x}
        y={shape.y}
        width={shape.width || 1920}
        height={shape.height || 1080}
        onDragEnd={handleDragEnd}
        id={shape.id}
      >
        {shape.lines.map((line, i) => (
          <Line
            key={i}
            fill={shape.fill}
            points={line.points}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </Group>
      <Transformer
        ref={trRef}
        visible={activeTool === 'edit' && isSelected}
      />
    </>
  );
}

Freehand.propTypes = {
  activeTool: PropTypes.string.isRequired,
  fill: PropTypes.string,
  height: PropTypes.number,
  onShapeClick: PropTypes.func.isRequired,
  points: PropTypes.arrayOf(PropTypes.number),
  shape: PropTypes.object.isRequired,
  stroke: PropTypes.string,
  strokeWidth: PropTypes.number,
  width: PropTypes.number,
};

Freehand.defaultProps = {
  fill: 'red',
  height: 1080,
  points: [0, 0, 100, 0, 100, 100],
  stroke: 'black',
  strokeWidth: 1,
  width: 1920,
};

export default Freehand;
