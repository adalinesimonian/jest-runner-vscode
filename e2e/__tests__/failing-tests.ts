import path from 'path'
import { runJest, prepareDir } from '../utils'

const testPath = path.resolve(__dirname, '../failing-tests')

beforeAll(async () => {
  await prepareDir(testPath)
}, 45000)

describe('Failing tests', () => {
  it('should fail tests', async () => {
    const { exitCode, stderr, stdout, json } = await runJest(testPath)
    if (exitCode !== 1) {
      console.error('stderr', stderr)
      console.error('stdout', stdout)
    }
    expect(json).toMatchSnapshot()
    expect(exitCode).toBe(1)
  }, 30000)
})
