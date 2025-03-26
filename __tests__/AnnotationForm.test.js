import React from 'react';
import { shallow } from 'enzyme';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import AnnotationForm from '../src/annotationForm/AnnotationForm';
import AnnotationDrawing from '../src/annotationForm/AnnotationFormOverlay/AnnotationDrawing';
import TextEditor from '../src/TextEditor';
import ImageFormField from '../src/annotationForm/AnnotationFormOverlay/ImageFormField';

/** */
function createWrapper(props) {
  return shallow(
    <AnnotationForm
      id="x"
      config={{ annotation: {} }}
      receiveAnnotation={jest.fn()}
      windowId="abc"
      {...props}
    />,
  );
}

describe('AnnotationCreation', () => {
  let wrapper;
  it('renders a form', () => {
    wrapper = createWrapper();
    expect(wrapper.dive()
      .find('form').length)
      .toBe(1);
  });
  it('form has button toggles', () => {
    wrapper = createWrapper();
    expect(wrapper.dive()
      .find(ToggleButtonGroup).length)
      .toBe(3);
  });
  it('adds the AnnotationDrawing component', () => {
    wrapper = createWrapper();
    expect(wrapper.dive()
      .find(AnnotationDrawing).length)
      .toBe(1);
  });
  it('adds the TextEditor component', () => {
    wrapper = createWrapper();
    expect(wrapper.dive()
      .find(TextEditor).length)
      .toBe(1);
  });
  it('adds the ImageFormField component', () => {
    wrapper = createWrapper();
    expect(wrapper.dive()
      .find(ImageFormField).length)
      .toBe(1);
  });
  it('can handle annotations without target selector', () => {
    wrapper = createWrapper({
      annotation: {
        body: {
          purpose: 'commenting',
          value: 'Foo bar',
        },
        target: {},
      },
    });
    wrapper.dive();
  });
});
