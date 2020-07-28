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

    console.log('Writing wav file...');

    synthesizer.speakTextAsync(
      text,
      (r) => this.handleResponse(r, synthesizer),
      (e) => this.handleError(e, synthesizer),
      path.resolve(filename)
    )
  }

  private handleResponse(results: any, synthesizer: sdk.SpeechSynthesizer) {
    console.log(results)
    synthesizer.close()
  }

  private handleError(err: any, synthesizer: sdk.SpeechSynthesizer) {
    console.log(err)
    synthesizer.close()
  }
}