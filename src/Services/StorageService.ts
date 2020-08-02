import fs from 'fs'
import path from 'path'
import { Util } from '../Helpers/Utils'

interface IStorageService {
  createArticleFolder(): FileConfig
}

type FileConfig = {
  articlePath: string,
  audioFilename: string,
  markdownFilename: string,
  audioChunkFilename: string,
}

export class StorageService implements IStorageService{
  private value: any
  private references: any
  public resolvedArticlePath: string
  public markdownFilename: string
  public audioFilename: string
  public audioChunkFilename: string

  constructor(value: any, references: any) {
    this.value = value
    this.references = references

    this.init()
  }

  private init(): void {
    const user = Util.getUserObject(this.references)
    // articles/:username/:username-slug/:username-slug{.wav,.md}

    const namedSlug = `${user.username}_${this.value.slug}`
    const articlePath = `articles/${user.username}/${namedSlug}`
    const articleAudioChunksPath = `articles/${user.username}/${namedSlug}/chunks`

    if (!fs.existsSync(articlePath))
      fs.mkdirSync(articlePath, { recursive: true })

    if (!fs.existsSync(articleAudioChunksPath))
      fs.mkdirSync(articleAudioChunksPath, { recursive: true })

    this.resolvedArticlePath = path.resolve(__dirname, '..', articlePath)

    this.markdownFilename    = path.resolve(__dirname, '..', articlePath, `${namedSlug}.md`)
    this.audioFilename       = path.resolve(__dirname, '..', articlePath, `${namedSlug}.wav`)
    this.audioChunkFilename  = path.resolve(__dirname, '..', articleAudioChunksPath, `${namedSlug}-{index}.wav`)
  }

  public createArticleFolder() {
    return {
      articlePath: this.resolvedArticlePath,
      audioFilename: this.audioFilename,
      markdownFilename: this.markdownFilename,
      audioChunkFilename: this.audioChunkFilename
    }
  }

  public static saveMarkdownFile(markdownFilename: string, markdownContent: string) {
    fs.writeFileSync(markdownFilename, markdownContent, { encoding: 'utf-8' })
    console.log(`StorageService: Saved Markdown file`)
    console.log(`StorageService: in ${markdownFilename}`)
  }
}