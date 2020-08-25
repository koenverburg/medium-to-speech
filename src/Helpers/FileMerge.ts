import { execSync } from 'child_process'

export class FileMerge {
  public static merge(files: string[], output: string) {
    const mergeCommand = `sox ${files.join(' ')} ${output}`

    execSync(mergeCommand)

    console.log(`FileMerge: done!`);
  }
}