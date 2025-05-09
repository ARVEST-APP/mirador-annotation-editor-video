import React from 'react';
import { Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import TextEditor from '../TextEditor';

/**
 * TextAnnotation section
 * @param annoHtml
 * @param updateAnnotationBody
 * @returns {Element}
 * @constructor
 */
export default function TextFormSection(
  {
    annoHtml,
    updateAnnotationBody,
    t,
  },
) {
  return (
    <Grid container direction="column" spacing={1}>
      <Grid container item>
        <Typography variant="formSectionTitle">
          {t('note')}
        </Typography>
      </Grid>
      <Grid container item>
        <TextEditor
          setText={updateAnnotationBody}
          text={annoHtml}
        />
      </Grid>
    </Grid>
  );
}

TextFormSection.propTypes = {
  annoHtml: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
  updateAnnotationBody: PropTypes.func.isRequired,
};
