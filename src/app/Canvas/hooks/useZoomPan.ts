import * as React from 'react';

interface UseZoomPanReturn {
  zoom: number;
  pan: { x: number; y: number };
  previousZoom: number;
  isPanning: boolean;
  panStart: { x: number; y: number };
  spacePressed: boolean;
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setPreviousZoom: React.Dispatch<React.SetStateAction<number>>;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setPanStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setSpacePressed: React.Dispatch<React.SetStateAction<boolean>>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  handleCanvasPanStart: (e: React.MouseEvent) => void;
  handleCanvasPanMove: (e: React.MouseEvent) => void;
  handleCanvasPanEnd: () => void;
  handleWheel: (e: React.WheelEvent) => void;
}

export const useZoomPan = (): UseZoomPanReturn => {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [previousZoom, setPreviousZoom] = React.useState(1);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = React.useState(false);

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2;

  const handleZoomIn = React.useCallback(() => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, MAX_ZOOM));
  }, []);

  const handleZoomOut = React.useCallback(() => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, MIN_ZOOM));
  }, []);

  const handleResetZoom = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleCanvasPanStart = React.useCallback((e: React.MouseEvent) => {
    // Only pan if space bar is pressed or middle mouse button (button === 1)
    const target = e.target as HTMLElement;
    const isCanvasBackground = target.classList.contains('workflow-canvas') || target.classList.contains('canvas-content');

    if (isCanvasBackground && (spacePressed || e.button === 1)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [spacePressed, pan.x, pan.y]);

  const handleCanvasPanMove = React.useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart.x, panStart.y]);

  const handleCanvasPanEnd = React.useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    // Only zoom if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);
      setZoom(newZoom);
    }
  }, [zoom, MIN_ZOOM, MAX_ZOOM]);

  return {
    zoom,
    pan,
    previousZoom,
    isPanning,
    panStart,
    spacePressed,
    MIN_ZOOM,
    MAX_ZOOM,
    setZoom,
    setPan,
    setPreviousZoom,
    setIsPanning,
    setPanStart,
    setSpacePressed,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,
    handleWheel,
  };
};
