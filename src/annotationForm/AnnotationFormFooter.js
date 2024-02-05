import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import React from 'react';
import { v4 as uuid } from 'uuid';
import {
  saveAnnotationInEachCanvas,
} from '../AnnotationCreationUtils';
import { secondsToHMS } from '../utils';
import {
  getJPGAsDataURL,
  getKonvaAsDataURL
} from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

const StyledButtonDivSaveOrCancel = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
}));

/** Annotation form footer, save or cancel the edition/creation of an annotation */
function AnnotationFormFooter({
  annotation,
  canvases,
  closeFormCompanionWindow,
  config,
  drawingState,
  receiveAnnotation,
  resetStateAfterSave,
  state,
  windowId,
}) {
  /**
   * Validate form and save annotation
   */
  const submitAnnotationForm = async (e) => {
    console.log('submitForm');
    e.preventDefault();
    // TODO Possibly problem of syncing
    // TODO Improve this code
    // If we are in edit mode, we have the transformer on the stage saved in the annotation
    /* if (viewTool === OVERLAY_VIEW && state.activeTool === 'edit') {
      setState((prevState) => ({
        ...prevState,
        activeTool: 'cursor',
      }));
      return;
    } */

    const {
      textBody,
      tags,
      xywh,
      tstart,
      tend,
      image,
    } = state;

    // Save annotation drawing in svg and sent it to the server
    // const svg = await getSvg(windowId);
    // const drawingImageExport = jpg;
    // const filename = await sendFile(drawingImageExport);
    // const annotationBodyImageId = fileReaderUrl + filename;

    // Save jpg image of the drawing in a data url
    const annotationBodyImageId = getKonvaAsDataURL(windowId);

    // Temporal target of the annotation
    const target = {
      t: (tstart && tend) ? `${tstart},${tend}` : null,
      xywh, // TODO retrouver calcul de xywh
    };

    const annotationText = (!textBody.length && target.t) ? `${secondsToHMS(tstart)} -> ${secondsToHMS(tend)}` : textBody;

    console.log('annotationBodyImageId:', annotationBodyImageId);

    const annotationToSaved = {
      body: {
        id: annotationBodyImageId,
        type: 'Image',
        format: 'image/svg+xml',
        value: annotationText,
      },
      drawingState: JSON.stringify(drawingState),
      id: (annotation && annotation.id) || `${uuid()}`,
      motivation: 'commenting',
      target: null,
      type: 'Annotation', // Will be updated in saveAnnotationInEachCanvas
    };

    console.log('Annotation to save:', annotationToSaved);
    console.log('target:', target);

    const isNewAnnotation = !annotation;

    saveAnnotationInEachCanvas(canvases, config, receiveAnnotation, annotationToSaved, target, isNewAnnotation);

    closeFormCompanionWindow();

    resetStateAfterSave();
  };

  return (
    <StyledButtonDivSaveOrCancel>
      <Button onClick={closeFormCompanionWindow}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="primary"
        type="submit"
        onClick={submitAnnotationForm}
      >
        Save
      </Button>
    </StyledButtonDivSaveOrCancel>
  );
}

AnnotationFormFooter.propTypes = {
  annotation: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  drawingState: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  receiveAnnotation: PropTypes.func.isRequired,
  resetStateAfterSave: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
};

export default AnnotationFormFooter;
