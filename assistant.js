import {Configuration, OpenAIApi} from "openai";
import dotenv from "dotenv";

dotenv.config()
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

export default class Assistant {
    async ask(messages) {
        let answer
        try {
            answer = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            })
        } catch (e) {
            console.error('\n' + e.message)
            console.log(e.response?.data?.error?.message)
            return null
        }

        return answer.data.choices[0].message
    }
}
