import fs from 'fs'
import path from 'path'
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter'

type Row = {
  project: string
  title: string
  status: string
  durationMs: number
  error?: string
}

class MatrixReporter implements Reporter {
  private rows = new Map<string, Row>()

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project()?.name ?? 'default'
    const title = test.titlePath().slice(1).join(' > ')
    this.rows.set(`${project}::${title}`, {
      project,
      title,
      status: result.status,
      durationMs: result.duration,
      error: result.error?.message?.split('\n')[0],
    })
  }

  onEnd(result: FullResult) {
    const dir = path.resolve('e2e/artifacts')
    fs.mkdirSync(dir, { recursive: true })
    const tests = [...this.rows.values()]
    const summary = {
      status: result.status,
      passed: tests.filter((row) => row.status === 'passed').length,
      failed: tests.filter((row) => row.status === 'failed').length,
      skipped: tests.filter((row) => row.status === 'skipped' || row.status === 'interrupted').length,
      tests,
    }
    fs.writeFileSync(path.join(dir, 'matrix.json'), JSON.stringify(summary, null, 2))
  }
}

export default MatrixReporter
