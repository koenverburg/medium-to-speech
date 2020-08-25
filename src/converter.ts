import prettier from 'prettier'
import removeMarkdown from 'remove-markdown'
import { MediumHttpClient } from './client'
import { mediaTypes } from './Enums/mediaTypes'
import { markupTypes } from './Enums/markupTypes'
import { anchorTypes } from './Enums/anchorTypes'
import { paragraphTypes } from './Enums/paragraphTypes'
import { Util } from './Helpers/Utils'
import { StorageService } from './Services/StorageService'
import { IConverter } from './Interfaces/IConverter'

const medium = new MediumHttpClient()

export class Converter implements IConverter {
  private contents: any
  private _storageService: StorageService
  private formattedParagraphs: string[]

  constructor(contents: object) {
    this.contents = contents
    const { value, references } = this.contents.payload
    this._storageService = new StorageService(value, references)
  }

  public async toMarkdownAsync() {
    const { value, references } = this.contents.payload
    const { paragraphs, sections } = value.content.bodyModel

    const fileConfig = this._storageService.createArticleFolder()
    const frontmatter = this.createFrontmatter(value, references)
    const formattedParagraphs = await this.formatParagraphs(paragraphs)

    // adding the section divider
    sections.forEach((section: any, index: number) =>
      formattedParagraphs.splice(section.startIndex + index, 0, '\n\n---\n\n')
    )
    const markdown = this.prettifyMarkdown(frontmatter, formattedParagraphs)
    this.formattedParagraphs = formattedParagraphs

    return {
      content: markdown,
      filename: fileConfig.markdownFilename
    }
  }

  public async toRawTextAsync() {
    if (!this.formattedParagraphs) {
      await this.toMarkdownAsync()
    }

    const fileConfig = this._storageService.createArticleFolder()

    const text = this.prettifyMarkdown('', this.formattedParagraphs)
    const rawText = removeMarkdown(text)

    //  cleaning up some last remaining markdown bits
    const cleanedText = rawText.replace(new RegExp(/(>.?)\s?|(###)/, 'gm'), '')

    return {
      content: cleanedText,
      filename: fileConfig.audioFilename,
      filenameChunks: fileConfig.audioChunkFilename,
      chunksDirectory: fileConfig.audioChunksDirectory
    }
  }

  private determineTextFormatting(text: string, markups: []) {
    if (markups.length === 0) return text

    let prefix = ''
    let suffix = ''
    let formattedText = text

    const markup: any = markups.shift() // markups is an array with one item, using shift we can get the first item
    switch (markup.type) {
      case markupTypes.bold:
        prefix = '**'
        suffix = '**'
        break

      case markupTypes.italic:
        prefix = '*'
        suffix = '*'
        break

      case markupTypes.link:
        prefix = '['

        switch (markup.anchorType) {
          case anchorTypes.externalLink:
            suffix = `](${markup.href})`
            break
          case anchorTypes.internalLink:
            suffix = `](https://medium.com/u/${markup.userId})`
            break
          default:
            throw new Error(`Unsupported anchorType: ${markup.anchorType}`)
        }

        break

      case markupTypes.inlineCode:
        prefix = '`'
        suffix = '`'
        break

      default:
        throw new Error(`Unsupported markup type: ${markup.type}`)
    }

    // rewrite the text with formatting added
    formattedText = this.formatText(formattedText, markup, prefix, suffix)

    // Update the markups start and ends because we added more characters to render it to markdown
    markups.forEach((mu: any) => {
      if (mu.end <= markup.start) return

      if (mu.start >= markup.end) {
        mu.start += prefix.length + suffix.length
        mu.end += prefix.length + suffix.length
        return
      }

      mu.start += prefix.length
      mu.end += prefix.length
    })

    return formattedText
  }

  private formatText(text: string, markup: any, prefix: string, suffix: string) {
    return `${text.slice(0, markup.start)}${prefix}${text.slice(markup.start, markup.end)}${suffix}${text.slice(markup.end)}`
  }

  private formatParagraphs(paragraphs: any) {
    const results = paragraphs.map(async (paragraph: any, index: number) => {
      const { text, type, iframe, metadata, mixtapeMetadata } = paragraph

      const formattedText = this.determineTextFormatting(text, paragraph.markups)

      switch (type) {
        case paragraphTypes.paragraph:
          return formattedText

        case paragraphTypes.h1:
          if (index === 0) { // ignore the first otherwise you have double titles
            return ''
          } else {
            return `# ${formattedText}`
          }

        case paragraphTypes.h3:
          // This is strange case because It looks like a h3 but on medium it renders as an blockquote
          return `> ### ${formattedText}`

        case paragraphTypes.h4:
          return `#### ${formattedText}`

        case paragraphTypes.quote:
          return `> ${formattedText}`

        case paragraphTypes.codeBlock:
          return '```\n' + formattedText + '\n```'

        case paragraphTypes.onOrderedList:
          return `- ${formattedText}`

        case paragraphTypes.orderedList:
          return `- ${formattedText}`

        case paragraphTypes.image:
          return `![${formattedText}](https://cdn-images-1.medium.com/max/${metadata.originalWidth * 2}/${metadata.id})`

        case paragraphTypes.imageWithDescription:
          // do api call to look up mediaResourceType
          const { payload: { value: resource } } = await medium.getMediaResource(`https://medium.com/media/${mixtapeMetadata.mediaResourceId}?format=json`)
          const image = this.determineMediaEmbed(resource)
          return image

        case paragraphTypes.iframeMedia:
          // console.log(mixtapeMetadata);
          // throw new Error(`Not Implemented Error paragraphType: ${paragraphTypes.media}`);
          return formattedText
      }

      process.stdout.write(`${paragraph}\n`)
      throw new Error(`Unsupported type: ${type}`);
    })

    return Promise.all<string>(results)
  }


  private determineMediaEmbed(resource: any) {
    switch (resource.mediaResourceType) {
      case mediaTypes.MediaResourceMediumPost:
      case mediaTypes.MediaResourceExternalLink:
        if (resource.iframeSrc != '') {
          return this.formatIframe(resource)
        } else {
          return `
> [**${resource.title}**](${resource.href})
>
> <small>${resource.description}</small>
`
        }

      // NOTE: I have not come across this type yet, Will look into this post mvp
      case mediaTypes.MediaResourceTweet:
        // console.log(resource);
        process.stdout.write(`${resource}\n`)
        throw new Error(`Not Implemented Error mediaTypes: ${mediaTypes.MediaResourceTweet}`);
    }

    process.stdout.write(`${resource}\n`)
    throw new Error(`Unsupported type: ${resource.mediaResourceType}`);
  }

  private formatIframe(resource: any) {
    return `<iframe
                allowfullscreen
                frameborder="0"
                src="${resource.iframeSrc}"
                width="${resource.iframeWidth}"
                height="${resource.iframeHeight}"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
    `
  }

  private createFrontmatter(value: any, references: any) {
    const { mediumUrl, title, firstPublishedAt, latestPublishedAt } = value
    const user = Util.getUserObject(references)
    return `
---
Author: ${user.name}
Bio: ${user.bio}
Title: ${title}
Medium Author: https://medium.com/@${user.username}
Medium Article: ${mediumUrl}
Twitter: https://twitter.com/${user.twitterScreenName}
Article Published at: ${firstPublishedAt}
Article Updated at: ${latestPublishedAt}
Read: false
---
`
  }

  private prettifyMarkdown(frontmatter: string, formattedParagraphs: any) {
    const results = prettier.format(
      [frontmatter]
        .concat(formattedParagraphs)
        .join('\n\n'),
      {
        parser: 'markdown'
      }
    )

    return results
  }
}