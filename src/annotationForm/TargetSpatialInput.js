import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { VideosReferences } from 'mirador/dist/es/src/plugins/VideosReferences';
import { OSDReferences } from 'mirador/dist/es/src/plugins/OSDReferences';
import ToggleButton from '@mui/material/ToggleButton';
import AnnotationDrawing from './AnnotationDrawing';
import { defaultToolState, OVERLAY_TOOL, targetSVGToolState } from '../AnnotationCreationUtils';
import { manifestTypes, TARGET_VIEW } from '../AnnotationFormUtils';
import AnnotationFormOverlay from './AnnotationFormOverlay/AnnotationFormOverlay';
import CursorIcon from '../icons/Cursor';
import {Grid, TextField} from "@mui/material";

export function TargetSpatialInput({
  xywh, setXywh, svg, overlay, windowId, mediaType, onChange, targetDrawingState,closeFormCompanionWindow
}) {
  const [toolState, setToolState] = useState(targetSVGToolState);
  const [viewTool, setViewTool] = useState(TARGET_VIEW);

  const initDrawingState = () => {
    if (targetDrawingState) {
      return JSON.parse(targetDrawingState);
    }

    return {
      currentShape: null,
      isDrawing: false,
      shapes: [],
    };
  };

  const [drawingState, setDrawingState] = useState(initDrawingState());

  const [scale, setScale] = useState(1);
  /** Change scale from container / canva */
  const updateScale = () => {
    setScale(overlay.containerWidth / overlay.canvasWidth);
  };

  /**
   * Deletes a shape from the drawing state based on its ID.
   * If no shape ID is provided, clears all shapes from the drawing state.
   *
   * @param {string} [shapeId] - The ID of the shape to delete.
   * If not provided, clears all shapes.
   */
  const deleteShape = (shapeId) => {
    if (!shapeId) {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: [],
      }));
    } else {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: prevState.shapes.filter((shape) => shape.id !== shapeId),
      }));
    }
  };

  let player;
  if (mediaType === manifestTypes.VIDEO) {
    player = VideosReferences.get(windowId);
  }
  if (mediaType === manifestTypes.IMAGE) {
    player = OSDReferences.get(windowId);
  }

  // TODO save drawing state on change
  useEffect(() => {
    onChange({
      drawingState: JSON.stringify(drawingState),
    });
  }, [drawingState]);

  const showSVGSelector = true;

  const [showFragmentSelector, setShowFragmentSelector] = useState(false);

  // TODO disable svg selector if showFragmentSelector is true

  return (
      <Grid container direction="column" spacing={1}>
        <Grid item xs={12} container direction="column" spacing={1}>
          <Grid item>
            <Typography variant="subFormSectionTitle">Fragment</Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField type="text" value={xywh} onChange={(event) => onChange({ xywh: event.target.value })} />
          </Grid>
          <Grid item xs={4}>
            <ToggleButton value={showFragmentSelector} aria-label="select cursor" onChange={() => {
              setShowFragmentSelector(!showFragmentSelector);
            }}>
              <CursorIcon />
            </ToggleButton>
          </Grid>
        </Grid>
      { showSVGSelector && (
        <Grid item container direction="c">
          <Typography variant="subFormSectionTitle">SVG selection</Typography>
          <AnnotationDrawing
            scale={scale}
            activeTool={toolState.activeTool}
            fillColor={toolState.fillColor}
            strokeColor={toolState.strokeColor}
            strokeWidth={toolState.strokeWidth}
            closed={toolState.closedMode === 'closed'}
            windowId={windowId}
            player={player}
            // we need to pass the width and height of the image to the annotation drawing component
            width={overlay ? overlay.containerWidth : 1920}
            height={overlay ? overlay.containerHeight : 1080}
            originalWidth={overlay ? overlay.canvasWidth : 1920}
            originalHeight={overlay ? overlay.canvasHeight : 1080}
            updateScale={updateScale}
            imageEvent={toolState.imageEvent}
            setColorToolFromCurrentShape={() => {}}
            drawingState={drawingState}
            overlay={overlay}
            setDrawingState={setDrawingState}
            tabView="edit" // TODO change
            showStyleTools
            showFragmentSelector={showFragmentSelector}
            mediaType={mediaType}
            closeFormCompanionWindow={closeFormCompanionWindow}
          />
          <AnnotationFormOverlay
            toolState={toolState}
            deleteShape={deleteShape}
            setToolState={setToolState}
            shapes={drawingState.shapes}
            currentShape={drawingState.currentShape}
            setViewTool={setViewTool}
            showStyleTools={false}
          />
        </Grid>
      )}
    </Grid>

  );
}

TargetSpatialInput.propTypes = {
  setXywh: PropTypes.func.isRequired,
  xywh: PropTypes.string.isRequired,
};
