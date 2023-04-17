import {Configuration, OpenAIApi} from "openai";
import dotenv from "dotenv";

dotenv.config()
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

export default class Assistant {
    async ask(messages) {
        const answer = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages
        })

        return answer.data.choices[0].message
    }
}
