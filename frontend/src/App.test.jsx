import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./api.js', () => ({
  api: { get: vi.fn().mockRejectedValue(new Error('API not configured')), post: vi.fn(), patch: vi.fn() },
  getError: (error) => error.message,
}));

import App from './App.jsx';

describe('public learning entry', () => {
  beforeEach(() => localStorage.clear());

  it('opens the account creation form from the landing page', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /learning, in your rhythm/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /start learning/i }));
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});
