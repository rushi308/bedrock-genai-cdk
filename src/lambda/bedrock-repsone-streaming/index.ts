
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { streamifyResponse } from "lambda-stream";

import * as stream from 'stream';
import * as util from 'util';

const { Readable } = stream;
const pipeline = util.promisify(stream.pipeline);

function parseBase64(message: string) {
  return JSON.parse(Buffer.from(message, "base64").toString("utf-8"));
}

const client = new BedrockRuntimeClient({
  region: "us-west-2",
});

export const handler = streamifyResponse(
  async (event, responseStream, _context) => {

    console.log(event)

    const prompt = 'Can you please what is Pure Function in React?'

    const claudPrompt = `Human: Human:${prompt} Assistant:`;

    const params = {
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "*/*",
      body: `{"prompt":"${claudPrompt}","max_tokens_to_sample":2048,"temperature":0.5,"top_k":250,"top_p":0.5,"stop_sequences":[], "anthropic_version":"bedrock-2023-05-31"}`,
    };

    console.log(params);

    const command = new InvokeModelWithResponseStreamCommand(params);

    const response: any = await client.send(command);
    const chunks = [];

    for await (const chunk of response.body) {
      console.log(chunk,'---')
      const parsed = parseBase64(chunk.chunk.bytes);
      chunks.push(parsed.completion);
      responseStream.write(parsed.completion);
    }

    console.log(chunks.join(""));
    responseStream.end();
  }
);
export default handler;
