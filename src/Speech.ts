import fs from 'fs'
import path from 'path'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

export class Speech {
  public async ConvertToAudioFile(text: string, filename: string) {
    // We can't write directly to a file so we need to write to it from a stream
    const pullStream = sdk.AudioOutputStream.createPullStream()

    fs
      .createWriteStream(filename)
      .on('data', (arrayBuffer: ArrayBuffer) => {
        pullStream.read(arrayBuffer.slice(0))
      })
      .on('end', () => {
        pullStream.close()
      })

    // @ts-ignore
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_SERVICE_KEY, process.env.AZURE_REGION)
    speechConfig.speechRecognitionLanguage = 'en-US'

    const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream)
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)

    const chunks = this.createTextChunks(text, 2000)

    console.log('Speech: Writing wav file...')
    const audioParts = Promise.all(chunks.map(async (chunk: string, index: number) => {
      await this.synthesizePerChunk(synthesizer, filename.replace('{index}', index.toString()), chunk, chunk.length < 2000)
      return filename.replace('{index}', index.toString())
    }))

    return audioParts
  }

  private synthesizePerChunk(synthesizer: sdk.SpeechSynthesizer, filename: string, textChunk: string, isLast: boolean) {
    const isLastOrHandleResponse = (resolve: any) => (r: any) => {
      this.handleResponse(r, synthesizer)
      resolve(r)
    }

    return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
          textChunk,
          isLast ? isLastOrHandleResponse(resolve) : undefined,
          (e) => {
            reject(e)
            this.handleError(e, synthesizer)
          },
      path.resolve(filename)
    )
    })
  }

  private createTextChunks(text: string, chunkCharacterLimit: number) {
    const chunks: string[] = []

    console.log(`speech: text character count is ${text.length}`);
    console.log(`speech: text chunks is split up in ${Math.ceil(text.length / chunkCharacterLimit)} (${text.length / chunkCharacterLimit}) chunks`)

    for (var i = 0; Math.ceil(text.length / chunkCharacterLimit); i++) {
      let fromIndex = i === 0 ? 0 : chunkCharacterLimit * i
      let toIndex   = i === 0 ? chunkCharacterLimit : chunkCharacterLimit * (i + 1)

      let chunkedText = text.substring(fromIndex, toIndex)

      chunks.push(chunkedText)

      if (chunkedText.length < chunkCharacterLimit) {
        break
      }
    }

    return chunks
  }

  private handleResponse(results: any, synthesizer: sdk.SpeechSynthesizer) {
    console.log(`SpeechSynthesizer Response ${results.privResultId}`)
    synthesizer.close()
  }

  private handleError(err: any, synthesizer: sdk.SpeechSynthesizer) {
    console.log(err)
    synthesizer.close()
  }
}