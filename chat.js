import Assistant from "./assistant.js"
import Scenario from "chat-scenario"
import fs from "fs"
import prompts from "prompts";
import ora from "ora";

// select scenario

const files = fs.readdirSync('./scenarios')
    .filter(file => file.endsWith('.scenario'))
    .map(file => file.replace('.scenario', ''))

const file = files.length > 1 ? await prompts({
    type: 'select',
    name: 'scenario',
    message: 'Select a scenario',
    choices: files.map(file => ({
        title: file[0].toUpperCase() + file.slice(1).replace(/_/g, ' '),
        value: file
    })),
}) : {scenario: files[0]}

if (!file.scenario) {
    console.log('No scenario selected, exiting...')
    process.exit(0)
}

// read selected scenario 

const scenarioText = fs.readFileSync(`./scenarios/${file.scenario}.scenario`, 'utf-8')

// prepare to start

const assistant = new Assistant()
const scenario = new Scenario(scenarioText)

scenario.start()
let input = {}
let history = []

// loop over scenario until the end

while (history = scenario.next(input, true)) {
    if (!history) break

    const spinner = ora('Thinking...').start()
    const answer = await assistant.ask(history)
    spinner.stop()
    scenario.answer(answer)
    console.log(answer.content)

    if (scenario.hasNext && scenario.nextPlaceholders.length > 0) {
        input = await prompts({
            type: 'text',
            name: 'userInput',
            message: '',
        })
    }
}

console.log('--- The end! ---\n\n')
// console.log(scenario.history)
// console.log('\n\n')
// console.log(scenario.history
//     .map(message => `${message.role}:\n\t${message.content.replace(/\n/g, '\n\t')}`)
//     .join('\n\n')
// )
// console.log('\n\n\nThank you, goodbye!')
