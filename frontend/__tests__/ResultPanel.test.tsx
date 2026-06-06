import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ResultPanel from '../components/ResultPanel';

describe('ResultPanel Component', () => {
  test('renders standby message when feature is none', () => {
    render(<ResultPanel feature="none" debugMode={false} />);
    expect(screen.getByText(/Select a system module or say/i)).toBeInTheDocument();
  });

  test('renders OCR text when feature is ocr', () => {
    const text = 'Hello AccessAI OCR test';
    render(<ResultPanel feature="ocr" text={text} debugMode={false} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText(/Transmission Data/i)).toBeInTheDocument();
  });

  test('renders placeholder when OCR text is empty', () => {
    render(<ResultPanel feature="ocr" text="" debugMode={false} />);
    expect(screen.getByText(/No text detected in optical field/i)).toBeInTheDocument();
  });

  test('renders detections when feature is detection', () => {
    const detections = [
      { label: 'cup', confidence: 0.85 },
      { label: 'chair', confidence: 0.72 },
    ];
    render(<ResultPanel feature="detection" detections={detections} debugMode={false} />);
    expect(screen.getByText(/Object Array Detected \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('cup')).toBeInTheDocument();
    expect(screen.getByText('chair')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  test('renders error state when error is provided', () => {
    const errorMsg = 'Failed to connect to backend';
    render(<ResultPanel feature="ocr" error={errorMsg} debugMode={false} />);
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  test('renders debug panel in debugMode', () => {
    const debugInfo = {
      fps: 30,
      confidence: 85,
      processingMs: 120,
      speechConfidence: 0.95,
      ocrAccuracy: 90,
      model: 'yolov8n.pt',
    };
    render(
      <ResultPanel
        feature="ocr"
        debugMode={true}
        debug={debugInfo}
      />
    );
    expect(screen.getByText(/Live Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('120ms')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('yolov8n.pt')).toBeInTheDocument();
  });

  test('calls onReadAloud when Play Audio is clicked', () => {
    const onReadAloud = vi.fn();
    render(
      <ResultPanel
        feature="ocr"
        text="Speak this text"
        onReadAloud={onReadAloud}
        debugMode={false}
      />
    );
    const playBtn = screen.getByRole('button', { name: /Play Audio/i });
    fireEvent.click(playBtn);
    expect(onReadAloud).toHaveBeenCalledTimes(1);
  });
});
