import fs from 'fs'
import path from 'path'
import { Util } from '../Helpers/Utils'

interface IStorageService {
  createArticleFolder(): FileConfig
}

type FileConfig = {
  articleDirectory: string,
  audioFilename: string,
  markdownFilename: string,
  audioChunkFilename: string,
  audioChunksDirectory: string,
}

export class StorageService implements IStorageService {
  private value: any
  private references: any
  public resolvedArticleDirectory: string
  public markdownFilename: string
  public audioFilename: string
  public audioChunkFilename: string
  public resolvedArticleAudioChunksDirectory: string

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

    this.resolvedArticleDirectory = path.resolve(__dirname, '..', articlePath)
    this.resolvedArticleAudioChunksDirectory = path.resolve(__dirname, '..', articleAudioChunksPath)

    this.markdownFilename    = path.resolve(__dirname, '..', articlePath, `${namedSlug}.md`)
    this.audioFilename       = path.resolve(__dirname, '..', articlePath, `${namedSlug}.wav`)
    this.audioChunkFilename  = path.resolve(__dirname, '..', articleAudioChunksPath, `${namedSlug}-{index}.wav`)
  }

  public createArticleFolder() {
    return {
      articleDirectory: this.resolvedArticleDirectory,
      audioFilename: this.audioFilename,
      markdownFilename: this.markdownFilename,
      audioChunkFilename: this.audioChunkFilename,
      audioChunksDirectory: this.resolvedArticleAudioChunksDirectory
    }
  }

  public static saveMarkdownFile(markdownFilename: string, markdownContent: string) {
    fs.writeFileSync(markdownFilename, markdownContent, { encoding: 'utf-8' })
    console.log(`StorageService: Saved Markdown file`)
    console.log(`StorageService: in ${markdownFilename}`)
  }
}