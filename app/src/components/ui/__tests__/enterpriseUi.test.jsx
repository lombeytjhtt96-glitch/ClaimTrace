import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { z } from 'zod';
import { Button } from '../button';
import { Badge } from '../badge';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { ClaimTraceDataTable } from '../data-table';

describe('ClaimTrace Shadcn UI, TanStack Table & Zod primitives', () => {
  it('renders Shadcn Button, Badge, and Card cleanly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Status Infrastruktur</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="success">ONLINE</Badge>
          <Button size="sm">Jalankan Backup</Button>
        </CardContent>
      </Card>,
    );

    expect(screen.getByText('Status Infrastruktur')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jalankan Backup' })).toBeInTheDocument();
  });

  it('filters and renders rows in TanStack Table ClaimTraceDataTable', () => {
    const columns = [
      { accessorKey: 'claim_id', header: 'Kode Klaim' },
      { accessorKey: 'faskes', header: 'Faskes' },
    ];
    const data = [
      { claim_id: 'CLM-2026-8801', faskes: 'RS Khusus Mitra Husada' },
      { claim_id: 'CLM-2026-8802', faskes: 'RS Swasta As-Syifa' },
    ];

    render(<ClaimTraceDataTable columns={columns} data={data} searchPlaceholder="Cari klaim..." />);
    expect(screen.getByText('CLM-2026-8801')).toBeInTheDocument();
    expect(screen.getByText('CLM-2026-8802')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Cari klaim...');
    fireEvent.change(searchInput, { target: { value: '8802' } });
    expect(screen.queryByText('CLM-2026-8801')).not.toBeInTheDocument();
    expect(screen.getByText('CLM-2026-8802')).toBeInTheDocument();
  });

  it('validates Zod enterprise form schema rules accurately', () => {
    const schema = z.object({
      recipient: z.string().email(),
      resource: z.string().startsWith('/'),
    });

    expect(schema.safeParse({ recipient: 'verifikator@bpjs.go.id', resource: '/api/v1/claims' }).success).toBe(true);
    expect(schema.safeParse({ recipient: 'bukan-email', resource: 'no-slash' }).success).toBe(false);
  });
});
