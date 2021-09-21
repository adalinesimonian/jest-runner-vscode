import type {
  DownloadPlatform,
  DownloadVersion,
} from '@vscode/test-electron/out/download'
import { Console } from 'console'
import stream from 'stream'
import { downloadAndUnzipVSCode } from '@vscode/test-electron'

export default async function downloadVSCode(
  version?: DownloadVersion,
  platform?: DownloadPlatform,
  silent = false,
  useStdErr = false
): Promise<string> {
  let nullStream: stream.Writable | undefined

  if (silent) {
    nullStream = new stream.Writable({ write: () => undefined })
    global.console = new Console(nullStream)
  } else if (useStdErr) {
    global.console = new Console(process.stderr)
  }

  const vscodePath = await downloadAndUnzipVSCode(version, platform)

  if (nullStream) {
    nullStream.destroy()
  }
  if (silent || useStdErr) {
    global.console = console
  }

  return vscodePath
}
