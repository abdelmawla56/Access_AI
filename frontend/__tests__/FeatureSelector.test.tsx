import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeatureSelector from '../components/FeatureSelector';

describe('FeatureSelector Component', () => {
  test('renders all feature choices', () => {
    const onChange = vi.fn();
    render(<FeatureSelector active="none" onChange={onChange} />);

    expect(screen.getByRole('radio', { name: /Text Reader/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Object Vision/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Navigator/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Standby/i })).toBeInTheDocument();
  });

  test('marks the active feature as aria-checked', () => {
    const onChange = vi.fn();
    render(<FeatureSelector active="ocr" onChange={onChange} />);

    expect(screen.getByRole('radio', { name: /Text Reader/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Object Vision/i })).toHaveAttribute('aria-checked', 'false');
  });

  test('calls onChange with correct id on click', () => {
    const onChange = vi.fn();
    render(<FeatureSelector active="none" onChange={onChange} />);

    const ocrBtn = screen.getByRole('radio', { name: /Text Reader/i });
    fireEvent.click(ocrBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('ocr');
  });

  test('disables buttons when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<FeatureSelector active="none" onChange={onChange} disabled={true} />);

    const ocrBtn = screen.getByRole('radio', { name: /Text Reader/i });
    expect(ocrBtn).toBeDisabled();
  });
});
