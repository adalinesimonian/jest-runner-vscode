import path from 'path'
import { runJest, prepareDir } from '../utils'

const testPath = path.resolve(__dirname, '../passing-tests')

beforeAll(async () => {
  await prepareDir(testPath)
}, 10000)

describe('Passing tests', () => {
  it('should pass tests', async () => {
    const { exitCode, stderr, stdout, json } = await runJest(testPath)
    if (exitCode !== 0) {
      console.error('stderr', stderr)
      console.error('stdout', stdout)
    }
    expect(json).toMatchSnapshot()
    expect(stdout).toContain('This message was logged from the test file')
    expect(exitCode).toBe(0)
  }, 30000)
})
