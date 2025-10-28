import { renderHook, act } from '@testing-library/react';
import { useZoomPan } from './useZoomPan';

describe('useZoomPan', () => {
  describe('Initial State', () => {
    it('should initialize with default zoom of 1', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.zoom).toBe(1);
    });

    it('should initialize with zero pan offset', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.pan).toEqual({ x: 0, y: 0 });
    });

    it('should initialize with previousZoom of 1', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.previousZoom).toBe(1);
    });

    it('should initialize with isPanning false', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.isPanning).toBe(false);
    });

    it('should initialize with panStart at origin', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.panStart).toEqual({ x: 0, y: 0 });
    });

    it('should initialize with spacePressed false', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.spacePressed).toBe(false);
    });

    it('should initialize with MIN_ZOOM of 0.25', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.MIN_ZOOM).toBe(0.25);
    });

    it('should initialize with MAX_ZOOM of 2', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.MAX_ZOOM).toBe(2);
    });
  });

  describe('State Setters', () => {
    it('should update zoom when setZoom is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setZoom(1.5);
      });

      expect(result.current.zoom).toBe(1.5);
    });

    it('should update pan when setPan is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setPan({ x: 100, y: 200 });
      });

      expect(result.current.pan).toEqual({ x: 100, y: 200 });
    });

    it('should update previousZoom when setPreviousZoom is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setPreviousZoom(0.8);
      });

      expect(result.current.previousZoom).toBe(0.8);
    });

    it('should update isPanning when setIsPanning is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setIsPanning(true);
      });

      expect(result.current.isPanning).toBe(true);
    });

    it('should update panStart when setPanStart is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setPanStart({ x: 50, y: 75 });
      });

      expect(result.current.panStart).toEqual({ x: 50, y: 75 });
    });

    it('should update spacePressed when setSpacePressed is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setSpacePressed(true);
      });

      expect(result.current.spacePressed).toBe(true);
    });
  });

  describe('Zoom Functionality', () => {
    it('should zoom in by 0.1 when handleZoomIn is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.handleZoomIn();
      });

      expect(result.current.zoom).toBeCloseTo(1.1, 1);
    });

    it('should not exceed MAX_ZOOM when zooming in', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set zoom close to max
      act(() => {
        result.current.setZoom(1.95);
      });

      // Try to zoom in multiple times
      act(() => {
        result.current.handleZoomIn();
        result.current.handleZoomIn();
        result.current.handleZoomIn();
      });

      expect(result.current.zoom).toBe(2); // Should not exceed MAX_ZOOM
    });

    it('should zoom out by 0.1 when handleZoomOut is called', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.handleZoomOut();
      });

      expect(result.current.zoom).toBeCloseTo(0.9, 1);
    });

    it('should not go below MIN_ZOOM when zooming out', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set zoom close to min
      act(() => {
        result.current.setZoom(0.3);
      });

      // Try to zoom out multiple times
      act(() => {
        result.current.handleZoomOut();
        result.current.handleZoomOut();
        result.current.handleZoomOut();
      });

      expect(result.current.zoom).toBe(0.25); // Should not go below MIN_ZOOM
    });

    it('should reset zoom to 1 and pan to origin when handleResetZoom is called', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set zoom and pan to non-default values
      act(() => {
        result.current.setZoom(1.5);
        result.current.setPan({ x: 100, y: 200 });
      });

      expect(result.current.zoom).toBe(1.5);
      expect(result.current.pan).toEqual({ x: 100, y: 200 });

      // Reset
      act(() => {
        result.current.handleResetZoom();
      });

      expect(result.current.zoom).toBe(1);
      expect(result.current.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Pan Functionality', () => {
    it('should start panning when handleCanvasPanStart is called with space pressed', () => {
      const { result } = renderHook(() => useZoomPan());

      // Enable space pressed
      act(() => {
        result.current.setSpacePressed(true);
      });

      // Create mock event
      const mockEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(true), // Simulate canvas background
          },
        },
        button: 0,
        clientX: 100,
        clientY: 150,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(mockEvent);
      });

      expect(result.current.isPanning).toBe(true);
      expect(result.current.panStart).toEqual({ x: 100, y: 150 });
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should start panning when handleCanvasPanStart is called with middle mouse button', () => {
      const { result } = renderHook(() => useZoomPan());

      // Create mock event with middle mouse button (button === 1)
      const mockEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(true),
          },
        },
        button: 1,
        clientX: 100,
        clientY: 150,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(mockEvent);
      });

      expect(result.current.isPanning).toBe(true);
      expect(result.current.panStart).toEqual({ x: 100, y: 150 });
    });

    it('should not start panning if space is not pressed and middle mouse button is not used', () => {
      const { result } = renderHook(() => useZoomPan());

      const mockEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(true),
          },
        },
        button: 0,
        clientX: 100,
        clientY: 150,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(mockEvent);
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should not start panning if target is not canvas background', () => {
      const { result } = renderHook(() => useZoomPan());

      act(() => {
        result.current.setSpacePressed(true);
      });

      const mockEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(false), // Not canvas background
          },
        },
        button: 0,
        clientX: 100,
        clientY: 150,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(mockEvent);
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should update pan when handleCanvasPanMove is called while panning', () => {
      const { result } = renderHook(() => useZoomPan());

      // Start panning
      act(() => {
        result.current.setIsPanning(true);
        result.current.setPanStart({ x: 100, y: 150 });
      });

      // Move mouse
      const mockEvent = {
        clientX: 200,
        clientY: 250,
      } as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanMove(mockEvent);
      });

      expect(result.current.pan).toEqual({
        x: 200 - 100, // clientX - panStart.x
        y: 250 - 150, // clientY - panStart.y
      });
    });

    it('should not update pan when handleCanvasPanMove is called while not panning', () => {
      const { result } = renderHook(() => useZoomPan());

      const mockEvent = {
        clientX: 200,
        clientY: 250,
      } as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanMove(mockEvent);
      });

      expect(result.current.pan).toEqual({ x: 0, y: 0 }); // Should remain unchanged
    });

    it('should stop panning when handleCanvasPanEnd is called', () => {
      const { result } = renderHook(() => useZoomPan());

      // Start panning
      act(() => {
        result.current.setIsPanning(true);
      });

      expect(result.current.isPanning).toBe(true);

      // End panning
      act(() => {
        result.current.handleCanvasPanEnd();
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should calculate panStart correctly with existing pan offset', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set existing pan offset
      act(() => {
        result.current.setPan({ x: 50, y: 75 });
        result.current.setSpacePressed(true);
      });

      const mockEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(true),
          },
        },
        button: 0,
        clientX: 100,
        clientY: 150,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(mockEvent);
      });

      expect(result.current.panStart).toEqual({
        x: 100 - 50, // clientX - pan.x
        y: 150 - 75, // clientY - pan.y
      });
    });
  });

  describe('Mouse Wheel Zoom', () => {
    it('should zoom in when handleWheel is called with ctrl+wheel up', () => {
      const { result } = renderHook(() => useZoomPan());

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        deltaY: -100, // Negative deltaY = scroll up = zoom in
        preventDefault: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(result.current.zoom).toBeCloseTo(1.1, 1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should zoom out when handleWheel is called with ctrl+wheel down', () => {
      const { result } = renderHook(() => useZoomPan());

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        deltaY: 100, // Positive deltaY = scroll down = zoom out
        preventDefault: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(result.current.zoom).toBeCloseTo(0.9, 1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not zoom when handleWheel is called without ctrl or cmd', () => {
      const { result } = renderHook(() => useZoomPan());

      const mockEvent = {
        ctrlKey: false,
        metaKey: false,
        deltaY: -100,
        preventDefault: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(result.current.zoom).toBe(1); // Should remain unchanged
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should not exceed MAX_ZOOM when zooming in with wheel', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set zoom close to max
      act(() => {
        result.current.setZoom(1.95);
      });

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        deltaY: -100,
        preventDefault: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(result.current.zoom).toBe(2); // Should not exceed MAX_ZOOM
    });

    it('should not go below MIN_ZOOM when zooming out with wheel', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set zoom close to min
      act(() => {
        result.current.setZoom(0.3);
      });

      const mockEvent = {
        ctrlKey: true,
        metaKey: false,
        deltaY: 100,
        preventDefault: jest.fn(),
      } as unknown as React.WheelEvent;

      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(result.current.zoom).toBe(0.25); // Should not go below MIN_ZOOM
    });
  });

  describe('useCallback Stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useZoomPan());

      const firstHandleZoomIn = result.current.handleZoomIn;
      const firstHandleZoomOut = result.current.handleZoomOut;
      const firstHandleResetZoom = result.current.handleResetZoom;

      // Trigger re-render
      rerender();

      expect(result.current.handleZoomIn).toBe(firstHandleZoomIn);
      expect(result.current.handleZoomOut).toBe(firstHandleZoomOut);
      expect(result.current.handleResetZoom).toBe(firstHandleResetZoom);
    });

    it('should update handleCanvasPanStart when dependencies change', () => {
      const { result, rerender } = renderHook(() => useZoomPan());

      const firstHandleCanvasPanStart = result.current.handleCanvasPanStart;

      // Change spacePressed
      act(() => {
        result.current.setSpacePressed(true);
      });

      rerender();

      // Function reference should change because spacePressed changed
      expect(result.current.handleCanvasPanStart).not.toBe(firstHandleCanvasPanStart);
    });

    it('should update handleCanvasPanMove when isPanning changes', () => {
      const { result, rerender } = renderHook(() => useZoomPan());

      const firstHandleCanvasPanMove = result.current.handleCanvasPanMove;

      // Change isPanning
      act(() => {
        result.current.setIsPanning(true);
      });

      rerender();

      // Function reference should change because isPanning changed
      expect(result.current.handleCanvasPanMove).not.toBe(firstHandleCanvasPanMove);
    });

    it('should update handleWheel when zoom changes', () => {
      const { result, rerender } = renderHook(() => useZoomPan());

      const firstHandleWheel = result.current.handleWheel;

      // Change zoom
      act(() => {
        result.current.setZoom(1.5);
      });

      rerender();

      // Function reference should change because zoom changed
      expect(result.current.handleWheel).not.toBe(firstHandleWheel);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete pan workflow', () => {
      const { result } = renderHook(() => useZoomPan());

      // Enable space key
      act(() => {
        result.current.setSpacePressed(true);
      });

      // Start pan
      const startEvent = {
        target: {
          classList: {
            contains: jest.fn().mockReturnValue(true),
          },
        },
        button: 0,
        clientX: 100,
        clientY: 100,
        preventDefault: jest.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanStart(startEvent);
      });

      expect(result.current.isPanning).toBe(true);

      // Move
      const moveEvent = {
        clientX: 200,
        clientY: 150,
      } as React.MouseEvent;

      act(() => {
        result.current.handleCanvasPanMove(moveEvent);
      });

      expect(result.current.pan).toEqual({
        x: 100, // 200 - 100
        y: 50,  // 150 - 100
      });

      // End pan
      act(() => {
        result.current.handleCanvasPanEnd();
      });

      expect(result.current.isPanning).toBe(false);
    });

    it('should handle zoom in, zoom out, and reset workflow', () => {
      const { result } = renderHook(() => useZoomPan());

      expect(result.current.zoom).toBe(1);

      // Zoom in twice
      act(() => {
        result.current.handleZoomIn();
        result.current.handleZoomIn();
      });

      expect(result.current.zoom).toBeCloseTo(1.2, 1);

      // Zoom out once
      act(() => {
        result.current.handleZoomOut();
      });

      expect(result.current.zoom).toBeCloseTo(1.1, 1);

      // Reset
      act(() => {
        result.current.handleResetZoom();
      });

      expect(result.current.zoom).toBe(1);
    });

    it('should maintain pan offset across zoom operations', () => {
      const { result } = renderHook(() => useZoomPan());

      // Set pan offset
      act(() => {
        result.current.setPan({ x: 100, y: 200 });
      });

      expect(result.current.pan).toEqual({ x: 100, y: 200 });

      // Zoom in (should not affect pan)
      act(() => {
        result.current.handleZoomIn();
      });

      expect(result.current.pan).toEqual({ x: 100, y: 200 }); // Pan should be unchanged
      expect(result.current.zoom).toBeCloseTo(1.1, 1);
    });
  });
});
