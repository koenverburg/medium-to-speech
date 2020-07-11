import { paragraphTypes } from './Enums/paragraphTypes'
import { MediumHttpClient } from './client'
import { mediaTypes } from './Enums/mediaTypes'

const medium = new MediumHttpClient()

export class Converter {
  contents: any
  constructor(contents: object) {
    this.contents = contents
  }

  public convert() {
    const {
      firstPublishedAt,
      latestPublishedAt,
      slug,
      title
    } = this.contents.payload.value

    console.log(title);

    const { paragraphs, sections } = this.contents.payload.value.content.bodyModel;

    this.formatParagraphs(paragraphs);
    // console.log(sections);


    return ''
  }

  private async formatParagraphs(paragraphs: any) {
    const paragraphsBlocks = await paragraphs.map(async (paragraph: any, index: number) => {
      const { iframe, metadata, mixtapeMetadata, name, text, type } = paragraph;

      console.log( iframe, metadata, mixtapeMetadata, name, text, type );

      switch (type) {
        case paragraphTypes.paragraph:
            return text

        case paragraphTypes.h1:
            if (index === 0) {
              console.log('first title');
              console.log(text);
              return ''
            } else {
              return `# ${text}`
            }

        case paragraphTypes.h3:
          return `### ${text}`

        case paragraphTypes.h4:
          return `#### ${text}`

        case paragraphTypes.quote:
          return `> ${text}`

        case paragraphTypes.codeBlock:
          return '```\n' + text + '\n```'

        case paragraphTypes.onOrderedList:
          return `- ${text}`

        case paragraphTypes.orderedList:
          return `1. ${text}`

        case paragraphTypes.image:
          return `![${text}](https://cdn-images-1.medium.com/max/${metadata.originalWidth * 2}/${metadata.id})`

        case paragraphTypes.imageWithDescription:
          // do api call to look up mediaResourceType
          const { payload: { value: resource } } = await medium.getMediaResource(`https://medium.com/media/${mixtapeMetadata.mediaResourceId}?format=json`)
          return this.determineMediaEmbed(resource)

        case paragraphTypes.media:
          // do api call to look up mediaResourceType
          medium.getMediaResource(`https://medium.com/media/${iframe.mediaResourceId}?format=json`)
          return text
      }

      process.stdout.write(`${paragraph}\n`)
      throw new Error(`Unsupported type: ${type}`);
    })
  }


  private determineMediaEmbed(resource: any) {
    switch (resource.mediaResourceType) {
      case mediaTypes.MediaResourceExternalLink:
        return this.formatIframe(resource)

      case mediaTypes.MediaResourceTweet:
        return ''
        // const { html } = await medium.getTweetEmbed(`https://publish.twitter.com/oembed?url=${resource.href}`)
        // return html
      case mediaTypes.MediaResourceMediumPost:
        return ''
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
}