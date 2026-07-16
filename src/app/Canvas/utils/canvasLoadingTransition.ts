export const CANVAS_LOADING_FLAG = 'canvasLoadingTransition';

export const markCanvasLoadingTransition = (): void => {
  sessionStorage.setItem(CANVAS_LOADING_FLAG, 'true');
};

export const consumeCanvasLoadingTransition = (): boolean => {
  const shouldShow = sessionStorage.getItem(CANVAS_LOADING_FLAG) === 'true';
  if (shouldShow) {
    sessionStorage.removeItem(CANVAS_LOADING_FLAG);
  }
  return shouldShow;
};
