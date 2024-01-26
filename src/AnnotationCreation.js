import React, { useEffect, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, ClickAwayListener, Divider, Grid, MenuItem, MenuList, Paper, Popover,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import RectangleIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CircleIcon from '@mui/icons-material/RadioButtonUnchecked';
import PolygonIcon from '@mui/icons-material/Timeline';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import GestureIcon from '@mui/icons-material/Gesture';
import ClosedPolygonIcon from '@mui/icons-material/ChangeHistory';
import OpenPolygonIcon from '@mui/icons-material/ShowChart';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import StrokeColorIcon from '@mui/icons-material/BorderColor';
import LineWeightIcon from '@mui/icons-material/LineWeight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FormatShapesIcon from '@mui/icons-material/FormatShapes';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import TitleIcon from '@mui/icons-material/Title';
import { SketchPicker } from 'react-color';
import { styled } from '@mui/material/styles';
import { v4 as uuid, v4 as uuidv4 } from 'uuid';
import { exportStageSVG } from 'react-konva-to-svg';
import CompanionWindow from 'mirador/dist/es/src/containers/CompanionWindow';
import { VideosReferences } from 'mirador/dist/es/src/plugins/VideosReferences';
import { OSDReferences } from 'mirador/dist/es/src/plugins/OSDReferences';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import AnnotationDrawing from './AnnotationDrawing';
import WebAnnotation from './WebAnnotation';
import CursorIcon from './icons/Cursor';
import ImageFormField from './ImageFormField';
import { secondsToHMS } from './utils';
import AnnotationFormContent from './AnnotationForm/AnnotationFormContent';
import AnnotationFormTime from './AnnotationForm/AnnotationFormTime';

/** Extract time information from annotation target */
function timeFromAnnoTarget(annotarget) {
  console.info('TODO proper time extraction from: ', annotarget);
  // TODO w3c media fragments: t=,10 t=5,
  const r = /t=([0-9.]+),([0-9.]+)/.exec(annotarget);
  if (!r || r.length !== 3) {
    return [0, 0];
  }
  return [Number(r[1]), Number(r[2])];
}

/** Extract xywh from annotation target */
function geomFromAnnoTarget(annotarget) {
  console.info('TODO proper xywh extraction from: ', annotarget);
  const r = /xywh=((-?[0-9]+,?)+)/.exec(annotarget);
  if (!r || r.length !== 3) {
    return '';
  }
  return r[1];
}

/** Component for creating annotations.
 * Display in companion window when a manifest is open and an annoation created or edited */
function AnnotationCreation(props) {
  // Initial state setup
  const [state, setState] = useState(() => {
    const annoState = {};
    if (props.annotation) {
      // annotation body
      if (Array.isArray(props.annotation.body)) {
        annoState.tags = [];
        props.annotation.body.forEach((body) => {
          if (body.purpose === 'tagging' && body.type === 'TextualBody') {
            annoState.tags.push(body.value);
          } else if (body.type === 'TextualBody') {
            annoState.textBody = body.value;
          } else if (body.type === 'Image') {
            // annoState.textBody = body.value; // why text body here ???
            annoState.image = body;
          } else if (body.type === 'AnnotationTitle') {
            annoState.title = body;
          }
        });
      } else if (props.annotation.body.type === 'TextualBody') {
        annoState.textBody = props.annotation.body.value;
      } else if (props.annotation.body.type === 'Image') {
        // annoState.textBody = props.annotation.body.value; // why text body here ???
        annoState.image = props.annotation.body;
      }
      //
      // drawing position
      if (props.annotation.target.selector) {
        if (Array.isArray(props.annotation.target.selector)) {
          props.annotation.target.selector.forEach((selector) => {
            if (selector.type === 'SvgSelector') {
              annoState.svg = selector.value;
            } else if (selector.type === 'FragmentSelector') {
              // TODO proper fragment selector extraction
              annoState.xywh = geomFromAnnoTarget(selector.value);
              [annoState.tstart, annoState.tend] = timeFromAnnoTarget(selector.value);
            }
          });
        } else {
          annoState.svg = props.annotation.target.selector.value;
          // TODO does this happen ? when ? where are fragments selectors ?
        }
      } else if (typeof props.annotation.target === 'string') {
        annoState.xywh = geomFromAnnoTarget(props.annotation.target);
        [annoState.tstart, annoState.tend] = timeFromAnnoTarget(props.annotation.target);
      }
    }

    // TODO add default values from config
    const toolState = {
      activeTool: 'cursor',
      closedMode: 'closed',
      colorPopoverOpen: false,
      currentColorType: false,
      fillColor: 'black',
      strokeColor: 'green',
      strokeWidth: 3,
      ...(props.config.annotation.defaults || {}),
    };

    const timeState = props.currentTime !== null
      ? { tend: Math.floor(props.currentTime) + 10, tstart: Math.floor(props.currentTime) }
      : { tend: null, tstart: null };

    return {
      ...toolState,
      ...timeState,
      activeTool: 'cursor',
      closedMode: 'closed',
      currentColorType: false,
      image: { id: null },
      imageEvent: null,
      lineWeightPopoverOpen: false,
      mediaVideo: null,
      popoverAnchorEl: null,
      popoverLineWeightAnchorEl: null,
      textBody: '',
      ...annoState,
      textEditorStateBustingKey: 0,
      valuetextTime: '',
      valueTime: [0, 1],
    };
  });
  const [scale, setScale] = useState(1);

  const { height, width } = VideosReferences.get(props.windowId).ref.current;

  useEffect(() => {
  }, [{ height, width }]);

  useLayoutEffect(() => {
  }, [{ height, width }]);

  // You can use useEffect for componentDidMount, componentDidUpdate, and componentWillUnmount
  useEffect(() => {
    // componentDidMount logic
    const mediaVideo = VideosReferences.get(props.windowId);
    setState((prevState) => ({ ...prevState, mediaVideo }));

    // componentWillUnmount logic (if needed)
    return () => {
      // cleanup logic here
    };
  }, []); // Empty array means this effect runs once, similar to componentDidMount

  /** */
  const handleImgChange = (newUrl, imgRef) => {
    setState((prevState) => ({
      ...prevState,
      image: { ...prevState.image, id: newUrl },
    }));
  };

  /** */
  const handleCloseLineWeight = (e) => {
    setState((prevState) => ({
      ...prevState,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    }));
  };

  /** */
  const handleLineWeightSelect = (e) => {
    setState((prevState) => ({
      ...prevState,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
      strokeWidth: e.currentTarget.value,
    }));
  };

  /** set annotation start time to current time */
  const setTstartNow = () => {
    setState((prevState) => ({
      ...prevState,
      tstart: Math.floor(props.currentTime),
    }));
  };

  /** set annotation end time to current time */
  const setTendNow = () => {
    setState((prevState) => ({
      ...prevState,
      tend: Math.floor(props.currentTime),
    }));
  };

  /**
   * @param {number} newValueTime
   */
  const setValueTime = (newValueTime) => {
    setState((prevState) => ({
      ...prevState,
      valueTime: newValueTime,
    }));
  };

  /**
   * @param {Event} event
   * @param {number} newValueTime
   */
  const handleChangeTime = (event, newValueTime) => {
    const timeStart = newValueTime[0];
    const timeEnd = newValueTime[1];
    updateTstart(timeStart);
    updateTend(timeEnd);
    seekToTstart();
    seekToTend();
    setValueTime(newValueTime);
  };

  /** update annotation start time */
  const updateTstart = (value) => {
    setState((prevState) => ({
      ...prevState,
      tstart: value,
    }));
  };

  /** update annotation end time */
  const updateTend = (value) => {
    setState((prevState) => ({
      ...prevState,
      tend: value,
    }));
  };

  /** update annotation title */
  const updateTitle = (e) => {
    setState((prevState) => ({
      ...prevState,
      title: e.target.value,
    }));
  };

  /** seekTo/goto annotation end time */
  const seekToTend = () => {
    setState((prevState) => ({
      ...prevState,
      ...props.setSeekTo(prevState.tend),
      ...props.setCurrentTime(prevState.tend),
    }));
  };

  // eslint-disable-next-line require-jsdoc
  const seekToTstart = () => {
    setState((prevState) => ({
      ...prevState,
      ...props.setSeekTo(prevState.tstart),
      ...props.setCurrentTime(prevState.tstart),
    }));
  };

  /** */
  const openChooseColor = (e) => {
    setState((prevState) => ({
      ...prevState,
      colorPopoverOpen: true,
      currentColorType: e.currentTarget.value,
      popoverAnchorEl: e.currentTarget,
    }));
  };

  /** */
  const openChooseLineWeight = (e) => {
    setState((prevState) => ({
      ...prevState,
      lineWeightPopoverOpen: true,
      popoverLineWeightAnchorEl: e.currentTarget,
    }));
  };

  /** Close color popover window */
  const closeChooseColor = (e) => {
    setState((prevState) => ({
      ...prevState,
      colorPopoverOpen: false,
      currentColorType: null,
      popoverAnchorEl: null,
    }));
  };

  /** Update strokecolor */
  const updateStrokeColor = (color) => {
    setState((prevState) => ({
      ...prevState,
      [prevState.currentColorType]: color.hex,
    }));
  };

  /**
   * Get SVG picture containing all the stuff draw in the stage (Konva Stage).
   * This image will be put in overlay of the iiif media
   */
  const getSvg = async () => {
    const stage = window.Konva.stages.find((s) => s.attrs.id === props.windowId);
    const svg = await exportStageSVG(stage); // TODO clean
    return svg;
  };

  /**
   * Validate form and save annotation
   */
  const submitForm = async (e) => {
    e.preventDefault();
    // TODO Possibly problem of syncing
    // TODO Improve this code
    // If we are in edit mode, we have the transformer on the stage saved in the annotation
    if (state.activeTool === 'edit') {
      setState((prevState) => ({
        ...prevState,
        activeTool: 'cursor',
      }));
      return;
    }

    const {
      annotation,
      canvases,
      receiveAnnotation,
      config,
    } = props;

    const {
      title,
      textBody,
      image,
      tags,
      xywh,
      tstart,
      tend,
      textEditorStateBustingKey,
    } = state;

    // TODO rename variable for better comprenhension
    const svg = await getSvg();

    const t = (tstart && tend) ? `${tstart},${tend}` : null;
    const body = { value: (!textBody.length && t) ? `${secondsToHMS(tstart)} -> ${secondsToHMS(tend)}` : textBody };

    // TODO promises not handled. Use promiseAll ?
    canvases.forEach(async (canvas) => {
      const storageAdapter = config.annotation.adapter(canvas.id);
      const anno = new WebAnnotation({
        body,
        canvasId: canvas.id,
        fragsel: {
          t,
          xywh,
        },
        id: (annotation && annotation.id) || `${uuid()}`,
        image,
        manifestId: canvas.options.resource.id,
        svg,
        tags,
        title,
      }).toJson();

      if (annotation) {
        storageAdapter.update(anno)
          .then((annoPage) => {
            receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage);
          });
      } else {
        storageAdapter.create(anno)
          .then((annoPage) => {
            receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage);
          });
      }
    });

    // TODO check if we need other thing in state
    setState({
      image: { id: null },
      svg: null,
      tend: 0,
      textBody: '',
      textEditorStateBustingKey: textEditorStateBustingKey + 1,
      title: '',
      tstart: 0,
      xywh: null,
    });
  };

  /** */
  const changeTool = (e, tool) => {
    setState((prevState) => ({
      ...prevState,
      activeTool: tool,
    }));
  };

  /** */
  const changeClosedMode = (e) => {
    setState((prevState) => ({
      ...prevState,
      closedMode: e.currentTarget.value,
    }));
  };

  /** */
  const updateTextBody = (textBody) => {
    setState((prevState) => ({
      ...prevState,
      textBody,
    }));
  };

  /**
  *
  */
  const addImage = () => {
    const data = {
      uuid: uuidv4(),
      id: image?.id,
    };

    setState((prevState) => ({
      ...prevState,
      imageEvent: data,
    }));
  };

  /** */
  const setShapeProperties = (options) => new Promise(() => {
    if (options.fill) {
      state.fillColor = options.fill;
    }

    if (options.strokeWidth) {
      state.strokeWidth = options.strokeWidth;
    }

    if (options.stroke) {
      state.strokeColor = options.stroke;
    }

    setState({ ...state });
  });

  /** */
  const updateGeometry = ({
    svg,
    xywh,
  }) => {
    setState((prevState) => ({
      ...prevState,
      svg,
      xywh,
    }));
  };

  /** */
  const {
    annotation,
    closeCompanionWindow,
    id,
    windowId,
  } = props;

  const {
    activeTool,
    colorPopoverOpen,
    currentColorType,
    fillColor,
    popoverAnchorEl,
    strokeColor,
    popoverLineWeightAnchorEl,
    lineWeightPopoverOpen,
    strokeWidth,
    closedMode,
    textBody,
    tstart,
    tend,
    textEditorStateBustingKey,
    image,
    valueTime,
    mediaVideo,
    title,
  } = state;

  // TODO : Vérifier ce code, c'est étrange de comprarer un typeof à une chaine de caractère.
  const mediaIsVideo = typeof VideosReferences.get(windowId) !== 'undefined';
  if (mediaIsVideo) {
    valueTime[0] = tstart;
    valueTime[1] = tend;
  }

  const myVideo = VideosReferences.get(windowId);
  const videoDuration = myVideo.props.canvas.__jsonld.duration;

  const videoref = VideosReferences.get(windowId);
  const osdref = OSDReferences.get(windowId);
  let overlay = null;
  if (videoref) {
    overlay = videoref.canvasOverlay;
  }
  if (osdref) {
    console.log('osdref', osdref);
  }

  const updateScale = (scale) => {
    setScale(overlay.containerWidth / overlay.canvasWidth);
  };

  useEffect(() => {
    console.log('scale', scale);
  }, [overlay.containerWidth, overlay.canvasWidth]);

  // stage.width(sceneWidth * scale);
  // stage.height(sceneHeight * scale);
  // stage.scale({ x: scale, y: scale });

  return (

  // we need to get the width and height of the image to pass it to the annotation drawing component

    <CompanionWindow
      title={title ? title.value : 'New Annotation'}
      windowId={windowId}
      id={id}
    >
      <AnnotationDrawing
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',

        }}
        scale={scale}
        activeTool={activeTool}
        annotation={annotation}
        fillColor={fillColor}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        closed={closedMode === 'closed'}
        updateGeometry={updateGeometry}
        windowId={windowId}
        player={mediaIsVideo ? VideosReferences.get(windowId) : OSDReferences.get(windowId)}
          /// we need to pass the width and height of the image to the annotation drawing component
        width={overlay ? overlay.containerWidth : 1920}
        height={overlay ? overlay.containerHeight : 1080}
        orignalWidth={overlay ? overlay.canvasWidth : 1920}
        orignalHeight={overlay ? overlay.canvasHeight : 1080}
        setShapeProperties={setShapeProperties}
        updateScale={updateScale}
        imageEvent={state.imageEvent}
          // TODO Ajouter du style pour que le Konva et la vidéo se superpose
      />
      <StyledForm
        onSubmit={submitForm}
      >
        <AnnotationFormContent
          onChange={updateTitle}
          textBody={textBody}
          textEditorStateBustingKey={textEditorStateBustingKey}
          updateTextBody={updateTextBody}
        />
        { mediaIsVideo && (
          <AnnotationFormTime
            mediaIsVideo={mediaIsVideo}
            videoDuration={videoDuration}
            value={valueTime}
            handleChangeTime={handleChangeTime}
            windowid={windowId}
            setTstartNow={setTstartNow}
            tstart={tstart}
            updateTstart={updateTstart}
            setTendNow={setTendNow}
            tend={tend}
            updateTend={updateTend}
          />)}
        <div>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="overline">
                Image Content
              </Typography>
            </Grid>
            <Grid item xs={8} style={{ marginBottom: 10 }}>
              <ImageFormField xs={8} value={image} onChange={handleImgChange} />
            </Grid>
            <Grid item xs={4} style={{ marginBottom: 10 }}>
              <Button variant="contained" onClick={addImage}>
                <AddPhotoAlternateIcon />
              </Button>
            </Grid>
          </Grid>
        </div>
        <div>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="overline">
                Target
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                <StyledToggleButtonGroup
                  value={activeTool}
                  exclusive
                  onChange={changeTool}
                  aria-label="tool selection"
                  size="small"
                >

                  <ToggleButton value="text" aria-label="select text">
                    <TitleIcon />
                  </ToggleButton>
                  <ToggleButton value="cursor" aria-label="select cursor">
                    <CursorIcon />
                  </ToggleButton>
                  <ToggleButton value="edit" aria-label="select cursor">
                    <FormatShapesIcon />
                  </ToggleButton>
                  <ToggleButton value="debug" aria-label="select cursor">
                    <AccessibilityNewIcon />
                  </ToggleButton>
                </StyledToggleButtonGroup>
                <StyledDivider
                  flexItem
                  orientation="vertical"
                />
                <StyledToggleButtonGroup
                  value={activeTool}
                  exclusive
                  onChange={changeTool}
                  aria-label="tool selection"
                  size="small"
                >
                  <ToggleButton value="arrow" aria-label="add an arrow">
                    <ArrowOutwardIcon />
                  </ToggleButton>
                  <ToggleButton value="rectangle" aria-label="add a rectangle">
                    <RectangleIcon />
                  </ToggleButton>
                  <ToggleButton value="ellipse" aria-label="add a circle">
                    <CircleIcon />
                  </ToggleButton>
                  <ToggleButton value="polygon" aria-label="add a polygon">
                    <PolygonIcon />
                  </ToggleButton>
                  <ToggleButton value="freehand" aria-label="free hand polygon">
                    <GestureIcon />
                  </ToggleButton>
                </StyledToggleButtonGroup>
              </Paper>
            </Grid>
          </Grid>
        </div>
        <div>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="overline">
                Style
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <ToggleButtonGroup
                aria-label="style selection"
                size="small"
              >
                <ToggleButton
                  value="strokeColor"
                  aria-label="select color"
                  onClick={openChooseColor}
                >
                  <StrokeColorIcon style={{ fill: strokeColor }} />
                  <ArrowDropDownIcon />
                </ToggleButton>
                <ToggleButton
                  value="strokeColor"
                  aria-label="select line weight"
                  onClick={openChooseLineWeight}
                >
                  <LineWeightIcon />
                  <ArrowDropDownIcon />
                </ToggleButton>
                <ToggleButton
                  value="fillColor"
                  aria-label="select color"
                  onClick={openChooseColor}
                >
                  <FormatColorFillIcon style={{ fill: fillColor }} />
                  <ArrowDropDownIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <StyledDivider flexItem orientation="vertical" />
              { /* close / open polygon mode only for freehand drawing mode. */
                activeTool === 'freehand'
                  ? (
                    <ToggleButtonGroup
                      size="small"
                      value={closedMode}
                      onChange={changeClosedMode}
                    >
                      <ToggleButton value="closed">
                        <ClosedPolygonIcon />
                      </ToggleButton>
                      <ToggleButton value="open">
                        <OpenPolygonIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )
                  : null
              }
            </Grid>
          </Grid>
        </div>
        <div>
          <Button onClick={closeCompanionWindow}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
        </div>
      </StyledForm>
      <Popover
        open={lineWeightPopoverOpen}
        anchorEl={popoverLineWeightAnchorEl}
      >
        <Paper>
          <ClickAwayListener onClickAway={handleCloseLineWeight}>
            <MenuList autoFocus role="listbox">
              {[1, 3, 5, 10, 50].map((option, index) => (
                <MenuItem
                  key={option}
                  onClick={handleLineWeightSelect}
                  value={option}
                  selected={option == strokeWidth}
                  role="option"
                  aria-selected={option == strokeWidth}
                >
                  {option}
                </MenuItem>
              ))}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popover>
      <Popover
        open={colorPopoverOpen}
        anchorEl={popoverAnchorEl}
        onClose={closeChooseColor}
      >
        <SketchPicker
            // eslint-disable-next-line react/destructuring-assignment
          color={state[currentColorType] || {}}
          onChangeComplete={updateStrokeColor}
        />
      </Popover>
    </CompanionWindow>
  );
}

const StyledForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  paddingBottom: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(1),
  paddingTop: theme.spacing(2),
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '&:first-of-type': {
    borderRadius: theme.shape.borderRadius,
  },
  '&:not(:first-of-type)': {
    borderRadius: theme.shape.borderRadius,
  },
  border: 'none',
  margin: theme.spacing(0.5),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(1, 0.5),
}));

AnnotationCreation.propTypes = {
  // TODO proper web annotation type ?
  annotation: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number,
    }),
  ),
  closeCompanionWindow: PropTypes.func,

  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      defaults: PropTypes.objectOf(
        PropTypes.oneOfType(
          [PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string],
        ),
      ),
    }),
  }).isRequired,
  currentTime: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(null)]),
  id: PropTypes.string.isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  setCurrentTime: PropTypes.func,
  setSeekTo: PropTypes.func,
  windowId: PropTypes.string.isRequired,
};

AnnotationCreation.defaultProps = {
  annotation: null,
  canvases: [],
  closeCompanionWindow: () => {
  },
  currentTime: null,
  paused: true,
  setCurrentTime: () => {
  },
  setSeekTo: () => {
  },
};

export default AnnotationCreation;
