import React, { useState } from 'react';
import PropTypes from 'prop-types';
import uuid from 'draft-js/lib/uuid';
import { Grid } from '@mui/material';
import TargetFormSection from './TargetFormSection';
import ManifestNetworkFormSection from './ManifestNetworkFormSection';
import { TEMPLATE } from './AnnotationFormUtils';
import AnnotationFormFooter from './AnnotationFormFooter';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TextCommentInput } from './TextCommentInput';
import { MultiTagsInput } from './MultiTagsInput';

/** Form part for edit annotation content and body */
function NetworkCommentTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    commentTemplate,
    playerReferences,
    saveAnnotation,
    t,
    tagsSuggestions,
    windowId,
  },
) {
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        id: uuid(),
        type: 'TextualBody',
        value: '',
      },
      maeData: {
        tags: [],
        manifestNetwork: '',
        target: null,
        templateType: TEMPLATE.MANIFEST_TYPE,
        textBody: {
          purpose: 'describing',
          type: 'TextualBody',
          value: '',
        },
      },
      motivation: 'commenting',
      target: null,
    };
  } else {
    if (maeAnnotation.maeData.target.drawingState
      && typeof maeAnnotation.maeData.target.drawingState === 'string') {
      maeAnnotation.maeData.target.drawingState = JSON.parse(
        maeAnnotation.maeData.target.drawingState,
      );
    }
    // We support only one textual body
    if (maeAnnotation.body && maeAnnotation.body.length > 0) {
      maeAnnotation.maeData.textBody = maeAnnotation.body.find((body) => body.purpose === 'describing');
      maeAnnotation.maeData.tags = maeAnnotation.body.filter((body) => body.purpose === 'tagging')
        .map((tag) => ({
          label: tag.value,
          value: tag.value,
        }));
    } else {
      // Only for retro compatibility in Arvest
      maeAnnotation.maeData.textBody = {
        purpose: 'describing',
        type: 'TextualBody',
        value: maeAnnotation.body.value,
      };
      maeAnnotation.maeData.tags = [];
    }
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /** Update annotationState with manifestData * */
  const updateManifestNetwork = (manifestNetwork) => {
    // TODO probably can be simplified
    const newMaeData = annotationState.maeData;
    newMaeData.manifestNetwork = manifestNetwork;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
  };

  /**
   * Update the annotation's Body
   * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    setAnnotationState({
      ...annotationState,
      maeData: {
        ...annotationState.maeData,
        textBody: {
          ...annotationState.maeData.textBody,
          value: newTextValue,
        },
      },
    });
  };

  /**
   * When the user selects a template, we change text comment and try to add the tag with same name
   * @param selectedTemplate
   */
  const onChangeTemplate = (selectedTemplate) => {
    const associatedTag = mappedSuggestionsTags.find((tag) => tag.value === selectedTemplate.label);
    if (associatedTag) {
      if (!annotationState.maeData.tags.find((tag) => tag.value === associatedTag.value)) {
        setAnnotationState({
          ...annotationState,
          maeData: {
            ...annotationState.maeData,
            tags: [...annotationState.maeData.tags, associatedTag],
            textBody: {
              ...annotationState.maeData.textBody,
              value: selectedTemplate.value,
            },
          },
        });
        return;
      }
    }

    updateAnnotationTextualBodyValue(selectedTemplate.value);
  };

  /** Update annotation with Tag Value * */
  const setTags = (newTags) => {
    setAnnotationState({
      ...annotationState,
      maeData: {
        ...annotationState.maeData,
        tags: newTags,
      },
    });
  };

  /** Update annotationState with Target * */
  const updateTargetState = (target) => {
    const newMaeData = annotationState.maeData;
    newMaeData.target = target;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
  };

  /**
   * Get the base annotation ID
   * @param id
   * @returns {*|null}
   */
  function getBaseAnnotation(id) {
    if (!id) {
      return null;
    }
    const match = id.match(
      /((http|https|localStorage)\:\/\/[a-z0-9\/:%_+.,#?!@&=-]+)#((http|https)\:\/\/[a-z0-9\/:%_+.,#?!@&=-]+)/gi,
    );

    return match ? match[0].split('#')
      .slice(1) : id;
  }

  /** SaveFunction for Manifest* */
  const saveFunction = () => {
    resizeKonvaStage(
      windowId,
      playerReferences.getMediaTrueWidth(),
      playerReferences.getMediaTrueHeight(),
      1 / playerReferences.getScale(),
    );

    const baseAnnotation = getBaseAnnotation(annotationState.id);
    if (baseAnnotation) {
      annotationState.id = `${baseAnnotation}#${annotation.maeData.manifestNetwork}`;
    }

    saveAnnotation(annotationState);
  };

  const mappedSuggestionsTags = tagsSuggestions.map((suggestion) => ({
    label: suggestion,
    value: suggestion,
  }));

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <ManifestNetworkFormSection
          manifestNetwork={annotation.maeData.manifestNetwork}
          onChange={updateManifestNetwork}
          t={t}
        />
      </Grid>
      <Grid item>
        <TextCommentInput
          commentTemplates={commentTemplate}
          comment={annotationState.maeData.textBody.value}
          setComment={updateAnnotationTextualBodyValue}
          onChangeTemplate={onChangeTemplate}
          t={t}
        />
      </Grid>
      <Grid item>
        <MultiTagsInput
          t={t}
          tags={annotationState.maeData.tags}
          setTags={setTags}
          tagsSuggestions={mappedSuggestionsTags}
        />
      </Grid>
      <TargetFormSection
        onChangeTarget={updateTargetState}
        playerReferences={playerReferences}
        spatialTarget
        t={t}
        target={annotationState.maeData.target}
        timeTarget
        windowId={windowId}
      />
      <Grid item>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveFunction}
          t={t}
          annotationState={annotationState}
        />
      </Grid>
    </Grid>
  );
}

NetworkCommentTemplate.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  annotation: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

export default NetworkCommentTemplate;
