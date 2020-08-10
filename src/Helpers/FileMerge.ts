import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export class FileMerge {
  public static merge(inputDir: string, output: string) {

    const files = fs.readdirSync(
      path.resolve(inputDir)
    ).filter(x => x.endsWith('.wav')).join(' ')

    const mergeCommand = `sox ${files} ${output}`
    execSync(mergeCommand)

    console.log(`FileMerge: done!`);
  }
}