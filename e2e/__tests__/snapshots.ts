import path from 'path'
import { runJest, prepareDir } from '../utils'

const testPath = path.resolve(__dirname, '../snapshots')

beforeAll(async () => {
  await prepareDir(testPath)
}, 10000)

describe('Snapshot tests', () => {
  it('should pass tests', async () => {
    const { exitCode, stderr, stdout, json } = await runJest(testPath)
    if (exitCode !== 0) {
      console.error('stderr', stderr)
      console.error('stdout', stdout)
    }
    expect(json).toMatchSnapshot()
    expect(exitCode).toBe(0)
  }, 30000)
})
