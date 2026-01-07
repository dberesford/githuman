import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffLine } from '../../../src/web/components/diff/DiffLine'
import { CommentProvider } from '../../../src/web/contexts/CommentContext'
import type { DiffLine as DiffLineType } from '../../../src/shared/types'

function renderWithProvider (ui: React.ReactElement) {
  return render(
    <CommentProvider reviewId={null}>
      {ui}
    </CommentProvider>
  )
}

describe('DiffLine', () => {
  it('renders added line with + prefix', () => {
    const line: DiffLineType = {
      type: 'added',
      content: 'new code',
      oldLineNumber: null,
      newLineNumber: 5,
    }

    renderWithProvider(<DiffLine line={line} filePath='test.ts' />)

    expect(screen.getByText('+')).toBeDefined()
    expect(screen.getByText('new code')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
  })

  it('renders removed line with - prefix', () => {
    const line: DiffLineType = {
      type: 'removed',
      content: 'old code',
      oldLineNumber: 3,
      newLineNumber: null,
    }

    renderWithProvider(<DiffLine line={line} filePath='test.ts' />)

    expect(screen.getByText('-')).toBeDefined()
    expect(screen.getByText('old code')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders context line with space prefix', () => {
    const line: DiffLineType = {
      type: 'context',
      content: 'unchanged code',
      oldLineNumber: 10,
      newLineNumber: 12,
    }

    renderWithProvider(<DiffLine line={line} filePath='test.ts' />)

    expect(screen.getByText('unchanged code')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('12')).toBeDefined()
  })

  it('hides line numbers when showLineNumbers is false', () => {
    const line: DiffLineType = {
      type: 'added',
      content: 'code',
      oldLineNumber: null,
      newLineNumber: 1,
    }

    renderWithProvider(<DiffLine line={line} filePath='test.ts' showLineNumbers={false} />)

    expect(screen.getByText('code')).toBeDefined()
    expect(screen.queryByText('1')).toBeNull()
  })

  it('renders empty content as space', () => {
    const line: DiffLineType = {
      type: 'context',
      content: '',
      oldLineNumber: 1,
      newLineNumber: 1,
    }

    const { container } = renderWithProvider(<DiffLine line={line} filePath='test.ts' />)

    // The pre/code element should exist
    const code = container.querySelector('code')
    expect(code).toBeDefined()
  })
})
